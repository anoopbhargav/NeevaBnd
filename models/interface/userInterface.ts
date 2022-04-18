export interface addUserInterface {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    userRole: string;
}

export interface editUserInterface {
    email: string;
    firstName: string;
    lastName: string;
    uid: number;
    userRole: string;
}

export interface deleteUserInterface {
    uid: number;
}

export interface signinInterfacer {
    email: string;
    password: string;
    fromOAuth: boolean;
}

export interface sendPassResetMailInterface {
    email: string;
}

export interface resetPasswordInterface {
    uid: number;
    otp: number;
    password: string;
}

export interface updateUserPasswordInterface {
    uid: number;
    currPassword: string;
    newPassword: string;
}
