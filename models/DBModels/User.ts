export interface User {
    id?: number;
    first_name: string;
    last_name: string;
    otp: string;
    email: string;
    password: string;
    token: string;
    user_role: string;
    is_active: boolean;
    //uniquekey:string
}
