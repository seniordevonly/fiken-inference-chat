import { RiToolsFill } from 'react-icons/ri';
import type { Agent } from '@/types/chat';

export const GROUPED_AGENTS: { title: string; agents: Agent[] }[] = [
  {
    title: 'Status & Setup',
    agents: [
      { id: 'fiken_status', name: 'Fiken: Check MCP Status', icon: RiToolsFill },
      { id: 'fiken_configure', name: 'Fiken: Configure Credentials', icon: RiToolsFill },
    ],
  },
  {
    title: 'Purchases',
    agents: [
      { id: 'fiken_get_purchases', name: 'List Purchases', icon: RiToolsFill },
      { id: 'fiken_create_purchase', name: 'Create Purchase', icon: RiToolsFill },
      { id: 'fiken_get_purchase', name: 'Get Purchase by ID', icon: RiToolsFill },
      { id: 'fiken_delete_purchase', name: 'Delete Purchase', icon: RiToolsFill },
      { id: 'fiken_create_purchase_draft', name: 'Create Purchase Draft', icon: RiToolsFill },
      { id: 'fiken_get_purchase_draft', name: 'Get Purchase Draft by ID', icon: RiToolsFill },
      { id: 'fiken_get_purchase_draft_attachments', name: 'List Draft Attachments', icon: RiToolsFill },
      { id: 'fiken_add_attachment_to_purchase_draft', name: 'Add Attachment to Draft', icon: RiToolsFill },
      { id: 'fiken_create_purchase_payment', name: 'Record Purchase Payment', icon: RiToolsFill },
    ],
  },
  {
    title: 'Invoices',
    agents: [
      { id: 'fiken_get_invoices', name: 'List Invoices', icon: RiToolsFill },
      { id: 'fiken_create_invoice', name: 'Create Invoice', icon: RiToolsFill },
      { id: 'fiken_get_invoice', name: 'Get Invoice by ID', icon: RiToolsFill },
      { id: 'fiken_update_invoice', name: 'Update Invoice', icon: RiToolsFill },
      { id: 'fiken_send_invoice', name: 'Send Invoice', icon: RiToolsFill },
      { id: 'fiken_get_invoice_drafts', name: 'List Invoice Drafts', icon: RiToolsFill },
      { id: 'fiken_create_invoice_draft', name: 'Create Invoice Draft', icon: RiToolsFill },
    ],
  },
];

export const AGENTS: Agent[] = [
  ...GROUPED_AGENTS.flatMap(s => s.agents),
];
