import { getAdminDb } from "@/lib/firebase/admin"
import { supprimerPdf } from "@/lib/cloudinary/upload"
import { Session, Forfait } from "@/types"

export async function creerSession(forfait: Forfait, token: string, email: string): Promise<Session> {
  const session: Session = {
    token,
    forfait,
    email,
    statut: "paid",
    nom_catalogue: "",
    description: "",
    style_choisi: 1,
    photos: [],
    pdf_url: null,
    pdf_hash: null,
    created_at: Date.now(),
    downloaded_at: null,
    pdf_expires_at: null,
    session_expires_at: null,
  }
  await getAdminDb().collection("sessions").doc(token).set(session)
  return session
}

export async function lireSession(token: string): Promise<Session | null> {
  const doc = await getAdminDb().collection("sessions").doc(token).get()
  if (!doc.exists) return null
  return doc.data() as Session
}

export async function verifierToken(token: string): Promise<Session | null> {
  const session = await lireSession(token);
  
  if (!session) return null;
  if (session.statut === "expired") return null;
  
  if (session.pdf_expires_at !== null && Date.now() > session.pdf_expires_at) {
    await expirerSession(token);
    return null;
  }
  
  return session;
}

export async function updateSession(
  token: string,
  data: Partial<Session>
): Promise<void> {
  await getAdminDb().collection("sessions").doc(token).update(data)
}

export async function marquerPdfPret(token: string, pdf_url: string, pdf_hash: string): Promise<void> {
  const maintenant = Date.now()
  const sept_jours = 7 * 24 * 60 * 60 * 1000
  
  await updateSession(token, {
    statut: "ready",
    pdf_url,
    pdf_hash,
    pdf_expires_at: maintenant + sept_jours,
    session_expires_at: maintenant + sept_jours
  })
}

export async function marquerTelechargement(token: string): Promise<void> {
  await updateSession(token, {
    statut: "downloaded",
    downloaded_at: Date.now()
  })
}

export async function expirerSession(token: string): Promise<void> {
  const session = await lireSession(token)
  if (!session) return

  if (session.pdf_url) {
    await supprimerPdf(token)
  }

  await updateSession(token, {
    statut: "expired",
    pdf_url: null
  })
}

/**
 * Trouve la session la plus récente créée pour cet email + forfait, dans la
 * fenêtre de minutes donnée, et **non encore consommée** (statut `paid`).
 *
 * Sert au flux "page merci après paiement" : Chariow ne connaît pas le token
 * (il est créé par le webhook côté serveur), il redirige donc le client vers
 * `/merci?email=...&forfait=...` qui résout le token via cette fonction.
 *
 * La fenêtre courte (10 min par défaut) + l'exigence `statut = paid` rendent
 * difficile le vol de session par un tiers qui devinerait l'email.
 */
export async function trouverSessionRecente(
  email: string,
  forfait: Forfait,
  fenetreMinutes = 10
): Promise<{ token: string; forfait: Forfait } | null> {
  const seuil = Date.now() - fenetreMinutes * 60 * 1000

  // Pas de tri/inégalité côté Firestore pour éviter l'index composite : on
  // filtre par email seul (index automatique), puis on affine en mémoire.
  const snap = await getAdminDb()
    .collection("sessions")
    .where("email", "==", email)
    .get()

  const candidates = snap.docs
    .map(d => d.data() as Session)
    .filter(s => s.forfait === forfait && s.statut === "paid" && s.created_at >= seuil)
    .sort((a, b) => b.created_at - a.created_at)

  if (candidates.length === 0) return null
  return { token: candidates[0].token, forfait: candidates[0].forfait }
}

export async function nettoyerSessionsExpirees(): Promise<number> {
  const maintenant = Date.now()
  const snapshot = await getAdminDb().collection("sessions")
    .where("pdf_expires_at", "<=", maintenant)
    .where("statut", "!=", "expired")
    .get()
    
  let count = 0
  for (const doc of snapshot.docs) {
    await expirerSession(doc.id)
    count++
  }
  
  return count
}
