import { AlertType } from '@/types';
import { IUserRegister } from '@/interfaces';

export interface AlertProps {
    type: AlertType;
    title: string;
    message: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export interface TokenResponse {
    errorType: string | null;
    userInfo: IUserRegister | null;
}