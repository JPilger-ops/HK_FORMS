import { AdminShell } from '@/components/admin/shell';
import { assertPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import {
  createExtraOptionAction,
  deleteExtraOptionAction,
  moveExtraOptionAction,
  updateExtraOptionAction
} from '@/server/actions/extras';
import { ExtraPricingType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  dangerButtonClasses,
  iconButtonClasses,
  primaryButtonClasses
} from '@/components/admin/settings/button-styles';

export default async function FormularSettingsPage() {
  await assertPermission('manage:settings');
  const extras = await prisma.extraOption.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  async function createExtra(formData: FormData) {
    'use server';
    const label = (formData.get('label') as string) ?? '';
    const description = (formData.get('description') as string) ?? '';
    const pricingType = (formData.get('pricingType') as ExtraPricingType) ?? 'PER_PERSON';
    const priceEuro = Number(formData.get('priceEuro') ?? 0);
    const isActive = formData.get('isActive') === 'on';
    await createExtraOptionAction({
      label,
      description,
      pricingType,
      priceCents: Math.round(priceEuro * 100),
      isActive
    });
    revalidatePath('/admin/settings/formular');
  }

  async function updateExtra(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const label = (formData.get('label') as string) ?? '';
    const description = (formData.get('description') as string) ?? '';
    const pricingType = (formData.get('pricingType') as ExtraPricingType) ?? 'PER_PERSON';
    const priceEuro = Number(formData.get('priceEuro') ?? 0);
    const isActive = formData.get('isActive') === 'on';
    await updateExtraOptionAction(id, {
      label,
      description,
      pricingType,
      priceCents: Math.round(priceEuro * 100),
      isActive
    });
    revalidatePath('/admin/settings/formular');
  }

  async function deleteExtra(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteExtraOptionAction(id);
    revalidatePath('/admin/settings/formular');
  }

  async function moveExtra(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const direction = (formData.get('direction') as 'up' | 'down') ?? 'up';
    await moveExtraOptionAction(id, direction);
    revalidatePath('/admin/settings/formular');
  }

  return (
    <AdminShell>
      <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div>
          <h2 className="text-xl font-semibold">Extras verwalten</h2>
          <p className="text-sm text-slate-500">
            Aktive Extras erscheinen im öffentlichen Formular als Checkboxen. Reihenfolge via Pfeile
            anpassen.
          </p>
          <div className="mt-4 space-y-3">
            {extras.map((extra) => (
              <div key={extra.id} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">{extra.label}</p>
                    <p className="text-slate-500">
                      {extra.pricingType === 'PER_PERSON'
                        ? `${(extra.priceCents / 100).toFixed(2)} € pro Person`
                        : `${(extra.priceCents / 100).toFixed(2)} € pauschal`}
                    </p>
                    {extra.description && (
                      <p className="text-xs text-slate-500">{extra.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Status: {extra.isActive ? 'aktiv' : 'inaktiv'} · Position: {extra.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <form action={moveExtra}>
                      <input type="hidden" name="id" value={extra.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button className={`${iconButtonClasses} text-sm`} type="submit">
                        ↑
                      </button>
                    </form>
                    <form action={moveExtra}>
                      <input type="hidden" name="id" value={extra.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button className={`${iconButtonClasses} text-sm`} type="submit">
                        ↓
                      </button>
                    </form>
                  </div>
                </div>

                <details className="mt-3 rounded border border-slate-200 bg-slate-50 p-2">
                  <summary className="cursor-pointer text-xs text-slate-600">Bearbeiten</summary>
                  <form action={updateExtra} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={extra.id} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Label</label>
                      <input
                        name="label"
                        defaultValue={extra.label}
                        className="mt-1 w-full rounded border px-2 py-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        Beschreibung
                      </label>
                      <textarea
                        name="description"
                        defaultValue={extra.description ?? ''}
                        className="mt-1 w-full rounded border px-2 py-1"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Preis (€)
                        </label>
                        <input
                          name="priceEuro"
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={(extra.priceCents / 100).toFixed(2)}
                          className="mt-1 w-full rounded border px-2 py-1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">Typ</label>
                        <select
                          name="pricingType"
                          defaultValue={extra.pricingType}
                          className="mt-1 w-full rounded border px-2 py-1"
                        >
                          <option value="PER_PERSON">pro Person</option>
                          <option value="FLAT">pauschal</option>
                        </select>
                      </div>
                    </div>
                    <label className="mt-1 flex items-center gap-2 text-xs text-slate-700">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked={extra.isActive}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Aktiv im Formular anzeigen
                    </label>
                    <button className={`${primaryButtonClasses} text-xs px-3 py-2`}>
                      Speichern
                    </button>
                  </form>
                </details>
                <form action={deleteExtra} className="mt-2">
                  <input type="hidden" name="id" value={extra.id} />
                  <button type="submit" className={`${dangerButtonClasses} text-xs px-3 py-2`}>
                    Löschen
                  </button>
                </form>
              </div>
            ))}
            {extras.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 p-3 text-sm text-slate-600">
                Noch keine Extras angelegt.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Neues Extra</h2>
          <form action={createExtra} className="mt-4 space-y-3 text-sm">
            <div>
              <label className="block text-slate-600">Label</label>
              <input
                name="label"
                className="mt-1 w-full rounded border px-3 py-2"
                required
                placeholder="z.B. Prosecco zum Aperitif"
              />
            </div>
            <div>
              <label className="block text-slate-600">Beschreibung</label>
              <textarea
                name="description"
                className="mt-1 w-full rounded border px-3 py-2"
                rows={2}
                placeholder="Optional: kurze Erläuterung"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600">Preis (€)</label>
                <input
                  name="priceEuro"
                  type="number"
                  step="0.01"
                  min={0}
                  className="mt-1 w-full rounded border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600">Typ</label>
                <select name="pricingType" className="mt-1 w-full rounded border px-3 py-2">
                  <option value="PER_PERSON">pro Person</option>
                  <option value="FLAT">pauschal</option>
                </select>
              </div>
            </div>
            <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300"
              />
              Aktiv im Formular anzeigen
            </label>
            <button className={`${primaryButtonClasses} w-full justify-center`}>
              Extra speichern
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
