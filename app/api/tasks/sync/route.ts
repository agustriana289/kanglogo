import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Get Tokens
        const { data: integration, error: tokenError } = await supabase
            .from("integrations")
            .select("*")
            .eq("service_name", "google_tasks")
            .single();

        if (tokenError || !integration) {
            return NextResponse.json({ error: "Not connected to Google Tasks" }, { status: 401 });
        }

        // 2. Init Google Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
        });

        // Check if token expired and refresh if needed (basic check)
        // googleapis handles refresh automatically if refresh_token is present and valid
        // But we might want to update the DB with new tokens if they change.
        // implementing a listener or just relying on the lib.

        const tasksService = google.tasks({ version: "v1", auth: oauth2Client });

        // 3. Get Default Task List
        const { data: taskLists } = await tasksService.tasklists.list();
        const taskListId = taskLists.items?.[0]?.id || "@default";

        // 4. Fetch Local Orders (Tasks)
        const { data: localOrders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .in("status", ["accepted", "in_progress", "completed"]);

        if (ordersError) throw ordersError;

        // 5. Fetch Google Tasks
        const { data: googleTasksData } = await tasksService.tasks.list({
            tasklist: taskListId,
            showCompleted: true,
            showHidden: true,
            maxResults: 100, // Limit for now
        });
        const googleTasks = googleTasksData.items || [];

        const operations = [];

        // --- SYNC EXPORT: Local -> Google ---
        for (const order of localOrders) {
            const orderTitle = `${order.customer_name} - ${order.invoice_number}`;
            const orderNotes = `Service: ${order.package_details?.name || 'Custom'}\nStatus: ${order.status}`;

            const mappedStatus = order.status === "completed" ? "completed" : "needsAction";

            if (!order.google_task_id) {
                // Create in Google
                operations.push(async () => {
                    const res = await tasksService.tasks.insert({
                        tasklist: taskListId,
                        requestBody: {
                            title: orderTitle,
                            notes: orderNotes,
                            status: mappedStatus,
                        },
                    });
                    // Update local with ID
                    await supabase
                        .from("orders")
                        .update({ google_task_id: res.data.id })
                        .eq("id", order.id);
                });
            } else {
                // Update Google (Check status mismatch)
                const gTask = googleTasks.find((t) => t.id === order.google_task_id);
                if (gTask) {
                    // If local status changed, update Google
                    if (
                        (order.status === "completed" && gTask.status !== "completed") ||
                        (order.status !== "completed" && gTask.status === "completed")
                    ) {
                        operations.push(async () => {
                            await tasksService.tasks.patch({
                                tasklist: taskListId,
                                task: order.google_task_id,
                                requestBody: {
                                    status: mappedStatus,
                                    title: orderTitle, // Keep title synced
                                },
                            });
                        });
                    }
                } else {
                    // ID exists locally but not in Google (Deleted in Google?)
                    // Option: Re-create or Clear ID. Let's clear ID so it re-creates next time or stays disconnected.
                    // For now, let's re-create.
                    operations.push(async () => {
                        const res = await tasksService.tasks.insert({
                            tasklist: taskListId,
                            requestBody: {
                                title: orderTitle,
                                notes: orderNotes,
                                status: mappedStatus,
                            },
                        });
                        await supabase
                            .from("orders")
                            .update({ google_task_id: res.data.id })
                            .eq("id", order.id);
                    });
                }
            }
        }

        // --- SYNC IMPORT: Google -> Local (Status update mainly) ---
        // If a Google Task is completed, complete the local order.
        // (User asked for "sebaliknya")
        for (const gTask of googleTasks) {
            const localOrder = localOrders.find(o => o.google_task_id === gTask.id);
            if (localOrder) {
                if (gTask.status === 'completed' && localOrder.status !== 'completed') {
                    operations.push(async () => {
                        await supabase
                            .from('orders')
                            .update({ status: 'completed' })
                            .eq('id', localOrder.id);
                    });
                }
                // If Google Task is un-completed?
                if (gTask.status === 'needsAction' && localOrder.status === 'completed') {
                    operations.push(async () => {
                        await supabase
                            .from('orders')
                            .update({ status: 'in_progress' }) // Revert to in_progress
                            .eq('id', localOrder.id);
                    });
                }
            }
        }

        // Execute operations
        await Promise.all(operations.map(op => op()));

        return NextResponse.json({ success: true, operations_count: operations.length });

    } catch (err: any) {
        console.error("Sync error:", err);
        return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
    }
}
