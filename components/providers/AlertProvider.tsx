"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import AlertModal from "@/components/AlertModal";

type AlertType = "success" | "warning" | "error" | "info";

interface AlertState {
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm?: () => void;
    isConfirmation: boolean;
}

interface AlertContextType {
    showAlert: (type: AlertType, title: string, message: string, confirmLabel?: string) => void;
    showConfirm: (
        title: string,
        message: string,
        type?: AlertType,
        confirmLabel?: string,
        cancelLabel?: string
    ) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AlertState>({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        confirmLabel: "OK",
        cancelLabel: "Batal",
        isConfirmation: false,
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const closeAlert = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null; // Clean up
        }
    }, []);

    const confirmAlert = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null; // Clean up
        }
    }, []);

    const showAlert = useCallback(
        (type: AlertType, title: string, message: string, confirmLabel = "OK") => {
            setState({
                isOpen: true,
                type,
                title,
                message,
                confirmLabel,
                cancelLabel: "",
                isConfirmation: false,
                onConfirm: undefined,
            });
        },
        []
    );

    const showConfirm = useCallback(
        (
            title: string,
            message: string,
            type: AlertType = "warning",
            confirmLabel = "Ya, Lanjutkan",
            cancelLabel = "Batal"
        ): Promise<boolean> => {
            return new Promise((resolve) => {
                resolveRef.current = resolve;
                setState({
                    isOpen: true,
                    type,
                    title,
                    message,
                    confirmLabel,
                    cancelLabel,
                    isConfirmation: true,
                    onConfirm: confirmAlert,
                });
            });
        },
        [confirmAlert]
    );

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal
                isOpen={state.isOpen}
                type={state.type}
                title={state.title}
                message={state.message}
                onClose={closeAlert}
                onConfirm={state.isConfirmation ? confirmAlert : () => closeAlert()}
                confirmLabel={state.confirmLabel}
                cancelLabel={state.cancelLabel}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
};
