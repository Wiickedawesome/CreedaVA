"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DataTable,
  Modal,
  Select,
  AdminTabs,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { exportToCsv } from "@/lib/utils/csv";
import type { Contact, ContactFormData } from "@/lib/types/crm";
import type { Lead, Customer } from "@/lib/types/crm";

const emptyContact: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  tags: [],
  notes: "",
};

export default function ContactsPage() {
  const { data: contacts, loading, add, edit, del } = useCollection<Contact>("contacts", {
    orderByField: "createdAt",
  });
  const { data: leads, add: addLead } = useCollection<Lead>("leads", {
    orderByField: "createdAt",
  });
  const { data: customers, add: addCustomer } = useCollection<Customer>("customers", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyContact);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [contacts]);

  const tagTabs = useMemo(() => [
    { label: "All", value: "all", badge: contacts.length },
    { label: "Tagged", value: "__tagged__", badge: contacts.filter((c) => c.tags?.length).length },
    { label: "Untagged", value: "__untagged__", badge: contacts.filter((c) => !c.tags?.length).length },
    ...allTags.map((tag) => ({
      label: tag,
      value: tag,
      badge: contacts.filter((c) => c.tags?.includes(tag)).length,
    })),
  ], [contacts, allTags]);

  const filtered = contacts.filter((c) => {
    // Tag filter
    if (tagFilter === "__tagged__" && !c.tags?.length) return false;
    if (tagFilter === "__untagged__" && c.tags?.length) return false;
    if (tagFilter !== "all" && tagFilter !== "__tagged__" && tagFilter !== "__untagged__" && !c.tags?.includes(tagFilter)) return false;
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false) ||
      (c.role?.toLowerCase().includes(q) ?? false)
    );
  });

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String(sortBy === "createdAt" ? a.createdAt : (a as unknown as Record<string, unknown>)[sortBy] ?? "");
      const bVal = String(sortBy === "createdAt" ? b.createdAt : (b as unknown as Record<string, unknown>)[sortBy] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  function openModal(contact?: Contact) {
    if (contact) {
      setSelected(contact);
      setForm({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        role: contact.role || "",
        tags: contact.tags || [],
        notes: contact.notes || "",
      });
    } else {
      setSelected(null);
      setForm(emptyContact);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    if (!form.email.trim()) {
      toast("Email is required", "error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast("Enter a valid email address", "error");
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        await edit(selected.id, form);
        toast("Contact updated successfully");
      } else {
        await add(form);
        toast("Contact created successfully");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save contact", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Contact deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete contact", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddAsLead() {
    if (!selected) return;
    const alreadyLead = leads.some(
      (l) => l.email.toLowerCase() === selected.email.toLowerCase(),
    );
    if (alreadyLead) {
      toast("Already exists as a lead", "info");
      return;
    }
    try {
      await addLead({
        name: selected.name,
        email: selected.email,
        phone: selected.phone || "",
        company: selected.company || "",
        source: "contact-book",
        status: "new",
        value: 0,
        notes: selected.notes || "",
      });
      toast("Added as Lead", "success");
    } catch {
      toast("Failed to add as lead", "error");
    }
  }

  async function handleAddAsCustomer() {
    if (!selected) return;
    const alreadyCustomer = customers.some(
      (c) => c.email.toLowerCase() === selected.email.toLowerCase(),
    );
    if (alreadyCustomer) {
      toast("Already exists as a customer", "info");
      return;
    }
    try {
      await addCustomer({
        name: selected.name,
        email: selected.email,
        phone: selected.phone || "",
        company: selected.company || "",
        plan: "",
        monthlyValue: 0,
        startDate: new Date().toISOString().slice(0, 10),
        status: "active",
        notes: selected.notes || "",
      });
      toast("Added as Customer", "success");
    } catch {
      toast("Failed to add as customer", "error");
    }
  }

  function handleExport() {
    exportToCsv("contacts", filtered, [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "company", header: "Company" },
      { key: "role", header: "Role" },
      { key: "notes", header: "Notes" },
    ]);
    toast("CSV exported", "info");
  }

  const columns: Column<Contact>[] = [
    { key: "name", header: "Name", render: (c) => <span className="font-medium text-gray-90">{c.name}</span> },
    { key: "email", header: "Email" },
    { key: "company", header: "Company" },
    { key: "role", header: "Role" },
    {
      key: "tags",
      header: "Tags",
      render: (c) =>
        c.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {c.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage your contact directory"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </Button>
            <Button size="sm" onClick={() => openModal()} className="w-full sm:w-auto">
              + Add Contact
            </Button>
          </div>
        }
      />

      <AdminTabs tabs={tagTabs} defaultValue="all" onChange={setTagFilter} />

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="max-w-sm w-full sm:flex-1">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            label="Sort contacts by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            options={[
              { value: "name", label: "Sort: Name" },
              { value: "email", label: "Sort: Email" },
              { value: "company", label: "Sort: Company" },
              { value: "role", label: "Sort: Role" },
              { value: "createdAt", label: "Sort: Date Added" },
            ]}
          />
          <button
            onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
            className="px-2 py-1.5 rounded-md border border-border text-xs text-gray-60 hover:bg-gray-10 transition-colors shrink-0"
            aria-label="Toggle contact sort direction"
          >
            {sortDir === "asc" ? "A → Z" : "Z → A"}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sorted}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => openModal(c)}
        emptyMessage="No contacts found"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Contact" : "New Contact"}
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
            {selected && (
              <Button variant="outline" size="sm" onClick={handleAddAsLead} className="w-full sm:w-auto">
                + Lead
              </Button>
            )}
            {selected && (
              <Button variant="outline" size="sm" onClick={handleAddAsCustomer} className="w-full sm:w-auto">
                + Customer
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
              {selected ? "Save Changes" : "Create Contact"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <Input label="Role / Job Title" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Contact"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting} className="w-full sm:w-auto">
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-70">
          Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
