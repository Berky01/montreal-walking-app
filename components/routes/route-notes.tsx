import { AlertTriangle, Info } from "lucide-react";
import type { AccessibilityNote, SafetyNote } from "@/lib/types";

export function RouteSafetyNotes({ notes }: { notes: SafetyNote[] }) {
  return (
    <NoteList
      icon={<AlertTriangle aria-hidden="true" size={18} />}
      notes={notes.map((note) => ({ ...note, tone: note.severity === "important" ? "text-error" : "text-tertiary" }))}
      title="Safety notes"
    />
  );
}

export function RouteAccessibilityNotes({ notes }: { notes: AccessibilityNote[] }) {
  return (
    <NoteList
      icon={<Info aria-hidden="true" size={18} />}
      notes={notes.map((note) => ({ ...note, tone: note.severity === "barrier" ? "text-error" : "text-secondary" }))}
      title="Accessibility notes"
    />
  );
}

function NoteList({
  title,
  notes,
  icon
}: {
  title: string;
  notes: Array<{ id: string; label: string; description: string; tone: string }>;
  icon: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-headline-mobile text-on-surface">{title}</h2>
      <div className="mt-4 grid gap-3">
        {notes.map((note) => (
          <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4" key={note.id}>
            <div className={`flex items-center gap-2 text-label-md ${note.tone}`}>
              {icon}
              <h3>{note.label}</h3>
            </div>
            <p className="mt-2 text-body-md text-on-surface-variant">{note.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
