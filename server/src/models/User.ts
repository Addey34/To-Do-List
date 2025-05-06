import { ObjectId } from 'mongodb';

export interface IUser {
    _id?: ObjectId;
    username: string;
    password: string;
}
