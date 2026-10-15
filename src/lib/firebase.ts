import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { ChatMessage, ChatSession, UserProfile } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot as mandated by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function onUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Profile helpers
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}/profiles/main`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'profiles', 'main'));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.userId}/profiles/main`;
  try {
    await setDoc(doc(db, 'users', profile.userId, 'profiles', 'main'), {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Chat Session helpers
export async function saveChatSession(session: ChatSession): Promise<void> {
  const path = `users/${session.userId}/chats/${session.id}`;
  try {
    await setDoc(doc(db, 'users', session.userId, 'chats', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  const path = `users/${userId}/chats`;
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    snapshot.forEach(d => {
      sessions.push(d.data() as ChatSession);
    });
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  const path = `users/${userId}/chats/${chatId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'chats', chatId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Chat Messages helpers
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const path = `users/${message.userId}/chats/${message.chatId}/messages/${message.id}`;
  try {
    // Sanitize message fields for Firestore
    const payload: Record<string, unknown> = {
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      role: message.role,
      content: message.content,
      mode: message.mode,
      createdAt: message.createdAt
    };
    if (message.imageUrl) payload.imageUrl = message.imageUrl;
    if (message.quizData) payload.quizData = JSON.stringify(message.quizData);
    if (message.tokenEstimate) payload.tokenEstimate = message.tokenEstimate;

    await setDoc(doc(db, 'users', message.userId, 'chats', message.chatId, 'messages', message.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getChatMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
  const path = `users/${userId}/chats/${chatId}/messages`;
  try {
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    snapshot.forEach(d => {
      const data = d.data();
      messages.push({
        id: data.id,
        chatId: data.chatId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        mode: data.mode,
        imageUrl: data.imageUrl,
        quizData: data.quizData ? JSON.parse(data.quizData) : null,
        tokenEstimate: data.tokenEstimate,
        createdAt: data.createdAt
      });
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
