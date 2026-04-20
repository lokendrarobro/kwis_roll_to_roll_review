export interface User
{
    role_id(arg0: string, role_id: any): unknown;
    filter(arg0: (element: any) => boolean): unknown;
    user_id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    phone?:string;
    status?: string;
    profile_picture: any;
    profile_picture_path: any;
}
