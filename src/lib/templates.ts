export function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key] ?? '');
}

export function toHtmlParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.trim().replace(/\n/g, '<br />')}</p>`)
    .join('');
}
