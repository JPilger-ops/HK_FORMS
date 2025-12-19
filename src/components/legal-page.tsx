type Props = {
  title: string;
  intro?: string;
  content: string;
};

export function LegalPage({ title, intro, content }: Props) {
  const paragraphs = content.trim().split(/\n{2,}/).filter(Boolean);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded bg-white p-6 shadow">
        <h1 className="text-3xl font-semibold text-brand">{title}</h1>
        {intro && <p className="mt-2 text-slate-600">{intro}</p>}
        <div className="mt-4 space-y-3 text-slate-700">
          {paragraphs.map((text, index) => (
            <p key={index} className="whitespace-pre-line leading-relaxed">
              {text.trim()}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
