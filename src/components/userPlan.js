import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "../firebase";

export const FREE_AI_LIMIT = 3;

export async function getOrCreateUserPlan(user) {
  if (!user) {
    return null;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return {
      id: userSnap.id,
      ...userSnap.data(),
    };
  }

  const defaultPlan = {
    user_id: user.uid,
    email: user.email || "",
    plan: "free",
    aiRequestsUsed: 0,
    aiRequestsLimit: FREE_AI_LIMIT,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, defaultPlan);

  return {
    id: user.uid,
    ...defaultPlan,
  };
}

export function canUseAiAnalysis(planData) {
  if (!planData) {
    return false;
  }

  if (planData.plan === "premium") {
    return true;
  }

  return Number(planData.aiRequestsUsed || 0) < Number(planData.aiRequestsLimit || FREE_AI_LIMIT);
}

export async function registerAiRequest(user, planData) {
  if (!user || !planData) {
    return;
  }

  if (planData.plan === "premium") {
    return;
  }

  const userRef = doc(db, "users", user.uid);

  await updateDoc(userRef, {
    aiRequestsUsed: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function upgradeToPremium(user) {
  if (!user) {
    return;
  }

  const userRef = doc(db, "users", user.uid);

  await updateDoc(userRef, {
    plan: "premium",
    aiRequestsLimit: 999999,
    updatedAt: serverTimestamp(),
  });
}

export async function downgradeToFree(user) {
  if (!user) {
    return;
  }

  const userRef = doc(db, "users", user.uid);

  await updateDoc(userRef, {
    plan: "free",
    aiRequestsLimit: FREE_AI_LIMIT,
    updatedAt: serverTimestamp(),
  });
}