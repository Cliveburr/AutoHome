import { ModuleType } from './moduleModel';

export class IndexViewModel
{
    public list: IndexModule[];
}

export class IndexModule
{
    public moduleVersionId: string;
    public name: string;
    public version: string;
    public type: ModuleType;
}

export class EditViewModel
{
    public moduleVersionId: string;
    public name: string;
    public version: string;
    public type: ModuleType;
    public user1File: string;
    public user1Blob: string;
    public user2File: string;
    public user2Blob: string;
}