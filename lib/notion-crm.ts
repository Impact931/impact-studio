// ---------------------------------------------------------------------------
// Notion CRM Sync — Clients & Rentals
// ---------------------------------------------------------------------------

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_VERSION = '2022-06-28';
const CLIENTS_DB = '22b5143cf7c245cdb943cdc522887223';
const RENTALS_DB = '00fb231905734cdaacebfc8c4c636c38';

const headers: Record<string, string> = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientData {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  stripeCustomerId?: string;
  createdAt: string;
}

interface RentalData {
  bookingId: string;
  renterName: string;
  email: string;
  phone?: string;
  company?: string;
  rentalDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  rentalMode: 'in_studio' | 'out_of_studio';
  productionType?: string;
  equipment: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number; // cents
  hasInsurance: boolean;
  insuranceProvider?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notionPost(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Notion API error:', error);
    throw new Error(`Notion API error: ${response.status}`);
  }

  return response.json();
}

async function notionPatch(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Notion API error:', error);
    throw new Error(`Notion API error: ${response.status}`);
  }

  return response.json();
}

async function notionGet(url: string) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = await response.text();
    console.error('Notion API error:', error);
    throw new Error(`Notion API error: ${response.status}`);
  }
  return response.json();
}

/** Find a Notion page in a database by a filter */
async function findPage(
  databaseId: string,
  filter: Record<string, unknown>,
): Promise<{ id: string } | null> {
  const result = await notionPost(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    { filter, page_size: 1 },
  );
  return result.results?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Clients DB — "Impact Studio — Clients"
// Properties: Client (title), Email, Phone, Company, Status (status),
//   Stripe Customer ID, Stripe Customer Link, Notes,
//   Customer ID, Last Login, Total Rentals, Total Spent,
//   Insurance Docs (files), Membership Agreement, Renter Agreement
// ---------------------------------------------------------------------------

/** Create a new client page in Notion Clients DB */
export async function createNotionClient(data: ClientData): Promise<string> {
  const properties: Record<string, unknown> = {
    Client: { title: [{ text: { content: data.name } }] },
    Email: { email: data.email },
    Phone: { phone_number: data.phone },
    'Customer ID': {
      rich_text: [{ text: { content: data.customerId } }],
    },
    'Last Login': { date: { start: data.createdAt } },
    'Total Rentals': { number: 0 },
    'Total Spent': { number: 0 },
    Status: { status: { name: 'Active' } },
  };

  if (data.company) {
    properties['Company'] = {
      rich_text: [{ text: { content: data.company } }],
    };
  }

  if (data.stripeCustomerId) {
    properties['Stripe Customer ID'] = {
      rich_text: [{ text: { content: data.stripeCustomerId } }],
    };
  }

  const page = await notionPost('https://api.notion.com/v1/pages', {
    parent: { database_id: CLIENTS_DB },
    properties,
  });

  return page.id;
}

/** Find a client in Notion by email and return page ID */
export async function findNotionClient(
  email: string,
): Promise<string | null> {
  const page = await findPage(CLIENTS_DB, {
    property: 'Email',
    email: { equals: email },
  });
  return page?.id ?? null;
}

/** Update last login timestamp for a client */
export async function updateNotionClientLogin(email: string): Promise<void> {
  const pageId = await findNotionClient(email);
  if (!pageId) {
    console.warn(`Notion client not found for email: ${email}`);
    return;
  }

  await notionPatch(`https://api.notion.com/v1/pages/${pageId}`, {
    properties: {
      'Last Login': { date: { start: new Date().toISOString() } },
    },
  });
}

/** Increment rental count and total spent for a client */
export async function updateNotionClientRentalStats(
  email: string,
  amountCents: number,
): Promise<void> {
  const pageId = await findNotionClient(email);
  if (!pageId) {
    console.warn(`Notion client not found for email: ${email}`);
    return;
  }

  // Fetch current values
  const pageData = await notionGet(
    `https://api.notion.com/v1/pages/${pageId}`,
  );

  const currentRentals =
    pageData.properties?.['Total Rentals']?.number ?? 0;
  const currentSpent =
    pageData.properties?.['Total Spent']?.number ?? 0;

  await notionPatch(`https://api.notion.com/v1/pages/${pageId}`, {
    properties: {
      'Total Rentals': { number: currentRentals + 1 },
      'Total Spent': { number: currentSpent + amountCents / 100 },
    },
  });
}

/** Update Stripe Customer ID on a client record */
export async function updateNotionClientStripe(
  email: string,
  stripeCustomerId: string,
): Promise<void> {
  const pageId = await findNotionClient(email);
  if (!pageId) return;

  await notionPatch(`https://api.notion.com/v1/pages/${pageId}`, {
    properties: {
      'Stripe Customer ID': {
        rich_text: [{ text: { content: stripeCustomerId } }],
      },
      'Stripe Customer Link': {
        url: `https://dashboard.stripe.com/customers/${stripeCustomerId}`,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Rentals DB — "Impact Studio — Rentals"
// Properties: Rental (title), Client (relation→Clients), Equipment (relation),
//   Start (date), End (date), Total (number $), Subtotal (number $), Tax (number),
//   Status (status), Notes, Stripe Payment Intent ID, Stripe Receipt Link,
//   Receipts (files), Services / Spaces (relation)
// ---------------------------------------------------------------------------

/** Create a rental record in Notion Rentals DB */
export async function createNotionRental(data: RentalData): Promise<string> {
  const modeLabel =
    data.rentalMode === 'in_studio' ? 'Studio' : 'Equipment';
  const equipmentList = data.equipment
    .map((e) => `${e.name} x${e.quantity}`)
    .join(', ');

  const totalDollars = data.totalAmount / 100;

  const properties: Record<string, unknown> = {
    Rental: {
      title: [
        {
          text: {
            content: `${data.renterName} — ${modeLabel} — ${data.rentalDate}`,
          },
        },
      ],
    },
    Start: { date: { start: `${data.rentalDate}T${data.startTime}:00` } },
    End: { date: { start: `${data.endDate}T${data.endTime}:00` } },
    Total: { number: totalDollars },
    Subtotal: { number: totalDollars },
    Status: { status: { name: 'Booked' } },
    Notes: {
      rich_text: [
        {
          text: {
            content: [
              `Booking ID: ${data.bookingId}`,
              `Mode: ${modeLabel}`,
              data.productionType
                ? `Production: ${data.productionType}`
                : null,
              `Equipment: ${equipmentList}`,
              `Insurance: ${data.hasInsurance ? data.insuranceProvider || 'Yes' : 'No — $500 hold'}`,
            ]
              .filter(Boolean)
              .join('\n'),
          },
        },
      ],
    },
  };

  if (data.stripePaymentIntentId) {
    properties['Stripe Payment Intent ID'] = {
      rich_text: [{ text: { content: data.stripePaymentIntentId } }],
    };
  }

  // Link to the client record via relation
  const clientPageId = await findNotionClient(data.email);
  if (clientPageId) {
    properties['Client'] = { relation: [{ id: clientPageId }] };
  }

  const page = await notionPost('https://api.notion.com/v1/pages', {
    parent: { database_id: RENTALS_DB },
    properties,
  });

  return page.id;
}
