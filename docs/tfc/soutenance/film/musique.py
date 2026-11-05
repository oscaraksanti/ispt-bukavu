"""Musique d'accompagnement originale du film (5 min, douce et posée).

Synthèse additive : nappe, arpèges de piano doux, basse, réverbération par convolution.
Usage : python3 musique.py sortie.wav [duree_s]
Composition originale produite pour ce film : libre de droits.
"""
import sys
import wave

import numpy as np

SR = 44100
DUREE = float(sys.argv[2]) if len(sys.argv) > 2 else 300.0
N = int(SR * DUREE)
rng = np.random.default_rng(2026)

TEMPO = 68.0
NOIRE = 60.0 / TEMPO
MESURE = 4 * NOIRE


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# Fa majeur, couleur apaisée : Fmaj9 – C/E – Dm9 – B♭maj7(#11)
ACCORDS = [
    {"basse": 41, "notes": [53, 57, 60, 64, 67]},   # F  : F A C E G
    {"basse": 40, "notes": [52, 55, 60, 62, 67]},   # C/E: E G C D G
    {"basse": 38, "notes": [50, 53, 57, 60, 64]},   # Dm9: D F A C E
    {"basse": 34, "notes": [46, 53, 57, 60, 62]},   # B♭maj7 : B♭ F A C D
]

gauche = np.zeros(N)
droite = np.zeros(N)


def ajouter(sig, debut, pan=0.0, gain=1.0):
    i = int(debut * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    gauche[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    droite[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def piano(midi, duree, vel):
    """Note de piano douce : partiels légèrement inharmoniques, aigus qui s'éteignent plus vite."""
    f = hz(midi)
    t = np.arange(int(SR * duree)) / SR
    s = np.zeros_like(t)
    for k, a in enumerate([1.0, 0.42, 0.18, 0.09, 0.05, 0.025], start=1):
        fk = f * k * np.sqrt(1 + 0.00025 * k * k)
        if fk > 9000:
            break
        s += a * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * (0.9 + 0.75 * k) * (f / 400) ** 0.3)
    att = np.minimum(1, t / 0.012)
    rel = np.minimum(1, (duree - t) / 0.4)
    return s * att * np.clip(rel, 0, 1) * vel


def nappe(midis, duree):
    """Nappe : sinus légèrement désaccordés, attaque et extinction lentes."""
    t = np.arange(int(SR * duree)) / SR
    s = np.zeros_like(t)
    for m in midis:
        f = hz(m)
        for d in (-0.07, 0.0, 0.07):
            fd = f * 2 ** (d / 12)
            s += np.sin(2 * np.pi * fd * t + rng.uniform(0, 6.28)) + 0.18 * np.sin(4 * np.pi * fd * t)
    env = np.minimum(1, t / 2.5) * np.clip((duree - t) / 2.5, 0, 1)
    lent = 0.85 + 0.15 * np.sin(2 * np.pi * t / 7.3)
    return s * env * lent / (3 * len(midis))


def basse(midi, duree):
    t = np.arange(int(SR * duree)) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.8) * np.exp(-t * 0.18) * np.clip((duree - t) / 1.0, 0, 1)
    return s * env


# Plan : intro (nappe seule), entrée du piano, partie centrale plus discrète (voix), fin apaisée.
DEB_PIANO = 6.0
FIN = DUREE - 8.0
DUREE_ACCORD = 2 * MESURE
MOTIFS = [
    [0, 2, 4, 2, 3, 1, 2, None],
    [0, 3, 2, 4, None, 2, 1, 3],
    [1, 2, 4, 3, 2, None, 0, 2],
]

t = 0.0
n = 0
while t < FIN:
    acc = ACCORDS[n % 4]
    d = min(DUREE_ACCORD, FIN - t) + 3.0
    ajouter(nappe(acc["notes"][:4], d + 1.0), t, pan=0.0, gain=0.55)
    ajouter(basse(acc["basse"], d), t, pan=0.0, gain=0.32)
    if t >= DEB_PIANO:
        motif = MOTIFS[(n // 4) % 3]
        croches = 16  # deux mesures en croches
        for c in range(croches):
            idx = motif[c % 8]
            if idx is None or (c % 8 == 7 and rng.random() < 0.5):
                continue
            note = acc["notes"][idx] + (12 if (c // 8 == 1 and idx >= 3 and rng.random() < 0.35) else 0)
            debut = t + c * NOIRE / 2 + rng.normal(0, 0.008)
            if debut >= FIN:
                break
            vel = 0.22 + 0.10 * (c % 4 == 0) + rng.uniform(-0.04, 0.04)
            ajouter(piano(note, 3.2, vel), debut, pan=rng.uniform(-0.35, 0.35))
    t += DUREE_ACCORD
    n += 1

# Accord final tenu
fin = ACCORDS[0]
ajouter(nappe(fin["notes"], 9.0), FIN, gain=0.6)
ajouter(basse(fin["basse"], 8.0), FIN, gain=0.3)
for k, m in enumerate(fin["notes"]):
    ajouter(piano(m, 6.0, 0.2), FIN + 0.12 * k, pan=-0.3 + 0.15 * k)


# Réverbération : convolution par une réponse impulsionnelle synthétique (bruit à décroissance exponentielle).
def reverb(x, graine):
    r = np.random.default_rng(graine)
    lng = int(SR * 3.2)
    ti = np.arange(lng) / SR
    ir = r.normal(0, 1, lng) * np.exp(-ti / 0.75)
    # filtre passe-bas simple sur la queue (moyenne glissante)
    ir = np.convolve(ir, np.ones(6) / 6, mode="same")
    ir[: int(SR * 0.02)] = 0
    ir /= np.sqrt(np.sum(ir**2))
    taille = 1 << int(np.ceil(np.log2(len(x) + lng)))
    y = np.fft.irfft(np.fft.rfft(x, taille) * np.fft.rfft(ir, taille), taille)[: len(x)]
    return y


wet_g, wet_d = reverb(gauche, 1), reverb(droite, 2)
g = 0.72 * gauche + 0.55 * wet_g
d = 0.72 * droite + 0.55 * wet_d

# Fondus d'entrée et de sortie
tt = np.arange(N) / SR
fondu = np.clip(tt / 3.0, 0, 1) * np.clip((DUREE - tt) / 4.0, 0, 1)
g *= fondu
d *= fondu
crete = max(np.max(np.abs(g)), np.max(np.abs(d)))
g, d = g / crete * 0.89, d / crete * 0.89

stereo = (np.stack([g, d], axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("musique :", sys.argv[1], f"{DUREE:.0f} s")
