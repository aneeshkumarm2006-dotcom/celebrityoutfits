import type { CollectionConfig } from 'payload'

import { admins } from '@/access'

/**
 * "Find me this dress." A visitor sends in an outfit they cannot identify.
 *
 * This is the demand signal the rest of the site has to guess at. Every row is
 * something a real person has asked for, with an address to send the answer
 * to — which makes the queue both a content plan and a mailing list that
 * builds itself.
 *
 * Private by design: `read` is admin-only, and the form writes through the
 * Local API rather than the REST endpoint, so there is no public route that
 * can list other people's submissions or their email addresses.
 */
export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: { singular: 'Research request', plural: 'Research requests' },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'status', 'email', 'createdAt'],
    group: 'Requests',
    description: 'What people have asked us to identify.',
  },
  access: {
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Request',
          fields: [
            {
              name: 'summary',
              type: 'text',
              required: true,
              admin: {
                description:
                  'What they want identified, in their own words. Shown as the title in the list.',
              },
            },
            {
              name: 'personGuess',
              type: 'text',
              label: 'Who they think it is',
              admin: { description: 'Optional. Often wrong, occasionally the whole answer.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'requestUploads',
                  admin: { width: '50%', description: 'Reference photo, if they attached one.' },
                },
                {
                  name: 'sourceUrl',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Where they saw it. Often more useful than the photo.',
                  },
                },
              ],
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              admin: { description: 'Where the answer goes. Never displayed publicly.' },
            },
          ],
        },
        {
          label: 'Handling',
          fields: [
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'new',
              options: [
                { label: 'New', value: 'new' },
                { label: 'Researching', value: 'researching' },
                { label: 'Answered', value: 'answered' },
                { label: 'Could not identify', value: 'unidentified' },
                { label: 'Declined / spam', value: 'declined' },
              ],
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              admin: { description: 'Working notes. Never sent to the requester.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'resultingLook',
                  type: 'relationship',
                  relationTo: 'looks',
                  admin: { width: '50%', description: 'The look this request produced.' },
                },
                {
                  name: 'resultingArticle',
                  type: 'relationship',
                  relationTo: 'articles',
                  admin: { width: '50%', description: 'The piece this request produced.' },
                },
              ],
            },
            {
              name: 'answeredAt',
              type: 'date',
              admin: {
                position: 'sidebar',
                description: 'Set automatically when the status becomes Answered.',
                date: { pickerAppearance: 'dayAndTime' },
              },
            },
            {
              name: 'notifiedAt',
              type: 'date',
              admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'When we emailed them the link.',
                date: { pickerAppearance: 'dayAndTime' },
              },
            },
          ],
        },
      ],
    },
    {
      /**
       * Hashed, not stored raw. We need to recognise a flood from one source
       * without keeping a log of who visited — the address is only ever
       * compared against itself, so the plaintext has no purpose here.
       */
      name: 'submitterHash',
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Rate-limit key.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Stamp the answer date the moment it is marked answered, so the queue
        // can report turnaround without anyone remembering to fill it in.
        if (data?.status === 'answered' && !originalDoc?.answeredAt && !data.answeredAt) {
          return { ...data, answeredAt: new Date().toISOString() }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
