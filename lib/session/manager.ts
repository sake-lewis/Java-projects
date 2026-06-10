import { getAdminDb } from "@/lib/firebase/admin"
import { supprimerPdf } from "@/lib/cloudinary/upload"
import { Session, Forfait } from "@/types"

interface CreerSessionParams {
  forfait: Forfait
  token: string
  email?: string | null
  phone?: string | null
  chariow_ref?: string | null
}

export async function creerSession(params: CreerSessionParams): Promise<Session> {
  const session: Session = {
    token: params.token,
    forfait: params.forfait,
    email: params.email ?? null,
    phone: params.phone ?? null,
    chariow_ref: params.chariow_ref ?? null,
    statut: "paid",
    claimed_at: null,
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
  await getAdminDb().collection("sessions").doc(params.token).set(session)
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
 * Trouve et **verrouille** la session la plus récente pour ce forfait, dans la
 * fenêtre courte donnée, **non encore réclamée** (statut `paid`).
 *
 * Sert au flux Chariow Pulse : le dashboard Chariow ne sait pas insérer de
 * variable dynamique (`{sale_id}`) dans l'URL de redirection, on identifie donc
 * la session par forfait + temporalité. La transaction Firestore atomique
 * empêche deux clients qui paieraient en simultané pour le même forfait de
 * récupérer la même session : le second tour de sondage trouvera SA session
 * (créée juste après).
 *
 * Pourquoi un verrou plutôt qu'une simple lecture : `paid → claimed` est
 * définitif et atomique, donc même si /merci est rechargée plusieurs fois ou
 * si plusieurs onglets sont ouverts en parallèle, la même session ne peut être
 * réclamée qu'une fois.
 */
export async function reclamerSessionRecente(
  forfait: Forfait,
  fenetreMinutes = 2
): Promise<{ token: string; forfait: Forfait } | null> {
  const db = getAdminDb()
  const seuil = Date.now() - fenetreMinutes * 60 * 1000

  // 1. Sélection des candidates (hors transaction — filtres + tri en mémoire
  //    pour éviter d'avoir à créer un index composite Firestore).
  const snap = await db
    .collection("sessions")
    .where("forfait", "==", forfait)
    .where("statut", "==", "paid")
    .get()

  const candidates = snap.docs
    .map(d => d.data() as Session)
    .filter(s => s.created_at >= seuil)
    .sort((a, b) => b.created_at - a.created_at)

  // 2. Pour chaque candidate (la plus récente d'abord), tenter le verrou
  //    atomique. Si une autre requête l'a réclamée entre-temps, on essaye la
  //    suivante. C'est la garantie anti-collision même en concurrence.
  for (const candidate of candidates) {
    const ref = db.collection("sessions").doc(candidate.token)
    const reussi = await db.runTransaction(async tx => {
      const doc = await tx.get(ref)
      if (!doc.exists) return false
      const s = doc.data() as Session
      if (s.statut !== "paid") return false
      tx.update(ref, { statut: "claimed", claimed_at: Date.now() })
      return true
    })
    if (reussi) {
      return { token: candidate.token, forfait: candidate.forfait }
    }
  }
  return null
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
