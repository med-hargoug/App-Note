import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Folder } from './interface/folder-interface'; // Adjust the path if you separate the interface

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly STORAGE_KEY = 'notion_app_folders';
  
  // Initialize the BehaviorSubject with data from localStorage
  private foldersSubject = new BehaviorSubject<Folder[]>(this.loadFromStorage());

  // Components will subscribe to this Observable to get real-time updates
  folders$: Observable<Folder[]> = this.foldersSubject.asObservable();

  constructor() {}

  // Get current folders synchronously
  getFolders(): Folder[] {
    return this.foldersSubject.getValue();
  }

  // Add a new folder
  addFolder(name: string): void {
    const newFolder: Folder = {
      id: crypto.randomUUID(), // Generates a unique ID securely
      name: name.trim()
    };
    
    const currentFolders = this.getFolders();
    const updatedFolders = [...currentFolders, newFolder];
    
    this.updateStateAndStorage(updatedFolders);
  }

  // Update a folder's name
  updateFolder(id: string, newName: string): void {
    const updatedFolders = this.getFolders().map(folder => 
      folder.id === id ? { ...folder, name: newName.trim() } : folder
    );
    this.updateStateAndStorage(updatedFolders);
  }

  // Delete a folder
  deleteFolder(id: string): void {
    const updatedFolders = this.getFolders().filter(folder => folder.id !== id);
    this.updateStateAndStorage(updatedFolders);
  }

  // --- Private Helper Methods ---

  // Loads data from localStorage or provides a default
  private loadFromStorage(): Folder[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    // Return a default "Général" folder if the user is opening the app for the first time
    return [{ id: 'default-folder', name: 'Général' }]; 
  }

  // Saves data to localStorage and pushes the new state to subscribers
  private updateStateAndStorage(folders: Folder[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(folders));
    this.foldersSubject.next(folders);
  }
}