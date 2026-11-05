import json, sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device="cpu", compute_type="int8")
segs, info = m.transcribe("voix16.wav", language="fr", word_timestamps=True, vad_filter=True, beam_size=5)
out = []
for s in segs:
    out.append({"debut": s.start, "fin": s.end, "texte": s.text.strip(), "mots": [[w.start, w.end, w.word] for w in s.words]})
    print(f"{s.start:7.2f} {s.end:7.2f}  {s.text.strip()}", flush=True)
json.dump(out, open(f"transcription-{sys.argv[1]}.json", "w"), ensure_ascii=False, indent=1)
