export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Expecting a JSON payload with pdf_url, signer_email, signer_name, document_name
    const { pdf_url, signer_email, signer_name, document_name } = req.body;

    // Secure token injection logic
    const authToken = process.env.AUTENTIQUE_TOKEN || 'e241ab943f3a01baf25c9b65b5c0ba4276c407e79614e543bd42eaded513bfc7';

    if (!pdf_url || !signer_email || !signer_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Fetch the PDF from Supabase Storage (public URL)
        const pdfResponse = await fetch(pdf_url);
        if (!pdfResponse.ok) {
            throw new Error("Failed to download PDF from storage");
        }
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

        // 2. Build the GraphQL Mutation for Autentique
        const graphqlQuery = `
      mutation CreateDocumentMutation(
        $document: DocumentInput!,
        $signers: [SignerInput!]!,
        $file: Upload!
      ) {
        createDocument(
          document: $document,
          signers: $signers,
          file: $file
        ) {
          id
          name
          refusable
          sortable
          created_at
          signatures {
            public_id
            name
            email
            created_at
            action { name }
            link { short_link }
            user { id name email }
          }
        }
      }
    `;

        // 3. Create FormData for multipart upload
        const formData = new FormData();

        // GraphQL Operations mapping
        const operations = JSON.stringify({
            query: graphqlQuery,
            variables: {
                document: {
                    name: document_name || "Contrato Entrega Facilitada",
                },
                signers: [
                    {
                        email: signer_email,
                        action: "SIGN",
                        positions: [
                            { x: "50", y: "80", z: 1 } // Basic signature positioning if position is needed
                        ]
                    }
                ],
                file: null
            }
        });

        formData.append('operations', operations);

        // GraphQL File mapping
        const map = JSON.stringify({
            "0": ["variables.file"]
        });
        formData.append('map', map);

        // Append actual file blob
        formData.append('0', pdfBlob, 'contrato.pdf');

        // 4. Send to Autentique
        const authHeaders = {
            'Authorization': `Bearer ${authToken}`
        };

        const autentiqueRes = await fetch('https://api.autentique.com.br/v2/graphql', {
            method: 'POST',
            headers: authHeaders,
            body: formData
        });

        const result = await autentiqueRes.json();

        if (result.errors) {
            console.error("Autentique Error:", result.errors);
            return res.status(400).json({ error: "Failed at Autentique", details: result.errors });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
