export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    category: 'Marketing' | 'Development' | 'Design' | 'Finance' | 'Other';
    due_date: string;
    created_at: string;
    updated_at: string;
    assignee?: {
        name: string;
        image_url?: string;
    };
    image_url?: string;
}
