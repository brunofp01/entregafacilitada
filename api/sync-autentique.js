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
      query GetDocumentStatus($id: UUID!) {
        document(id: $id) {
          id
          signatures {
            public_id
            action { name }
            viewed { created_at }
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
                    console.log(`Checking status for document: ${id}`);
                    const response = await fetch('https://api.autentique.com.br/v2/graphql', {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            query: graphqlQuery,
                            variables: { id }
                        })
                    });

                    const json = await response.json();

                    if (json.errors) {
                        console.error(`Autentique GraphQL Error for ${id}:`, JSON.stringify(json.errors));
                        return { id, status: 'error', error_detail: json.errors[0]?.message || 'GraphQL Error' };
                    }

                    if (!json.data || !json.data.document) {
                        return { id, status: 'error', error_detail: 'Documento não encontrado (Pode ter sido criado com outro Token)' };
                    }

                    const signatures = json.data.document.signatures || [];

                    const isSigned = signatures.some(sig => sig.signed && sig.signed.created_at);
                    const isRejected = signatures.some(sig => sig.rejected && sig.rejected.created_at);

                    console.log(`Document ${id} status - Signed: ${isSigned}, Rejected: ${isRejected}`);

                    return {
                        id,
                        status: isSigned ? 'assinado' : (isRejected ? 'rejeitado' : 'pendente'),
                        debug_signatures: signatures
                    };

                } catch (err) {
                    console.error(`Fetch error for ${id}:`, err);
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
