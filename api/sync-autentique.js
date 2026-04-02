export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { documentIds } = req.body;
    const authToken = process.env.AUTENTIQUE_TOKEN;

    if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ error: 'Missing documentIds array' });
    }

    if (!authToken) {
        return res.status(500).json({ error: 'Autentique Token is not configured in Vercel' });
    }

    try {
        const authHeaders = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        const graphqlQuery = `
      query GetDocumentStatus($id: ID!) {
        document(id: $id) {
          id
          signatures {
            signed { created_at }
            rejected { created_at }
          }
        }
      }
    `;

        // Process all document status requests concurrently
        const results = await Promise.all(
            documentIds.map(async (id) => {
                try {
                    const response = await fetch('https://api.autentique.com.br/v2/graphql', {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            query: graphqlQuery,
                            variables: { id }
                        })
                    });

                    const json = await response.json();
                    if (json.errors || !json.data || !json.data.document) {
                        return { id, status: 'error' };
                    }

                    const signatures = json.data.document.signatures || [];

                    // Check if at least one signature object has valid "signed" event payload
                    // (Because typically there's only one signer for these generated templates)
                    const isSigned = signatures.some(sig => sig.signed && sig.signed.created_at);
                    const isRejected = signatures.some(sig => sig.rejected && sig.rejected.created_at);

                    if (isSigned) return { id, status: 'assinado' };
                    if (isRejected) return { id, status: 'rejeitado' };

                    return { id, status: 'pendente' };

                } catch (err) {
                    return { id, status: 'error' };
                }
            })
        );

        return res.status(200).json({ success: true, statuses: results });
    } catch (error) {
        console.error("Sync API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
