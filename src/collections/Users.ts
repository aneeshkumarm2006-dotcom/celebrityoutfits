import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
  },
  auth: true,
  fields: [
    // Email added by default
    { name: 'name', type: 'text', admin: { description: 'Used to greet you on the dashboard.' } },
  ],
}
