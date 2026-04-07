import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Mocking fonts like in VistoriaPDF, using standard Courier or Helvetica if no fonts registered
// In a real scenario we'd use registered fonts. We will use basic Arial/Helvetica lookalike.
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#333', lineHeight: 1.5 },
    header: { flexContent: 'center', alignItems: 'center', marginBottom: 30, borderBottom: '2px solid #142542', paddingBottom: 10 },
    logo: { width: 120, marginBottom: 10 },
    title: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#142542', textTransform: 'uppercase' },
    sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 10, color: '#142542', backgroundColor: '#f3f4f6', padding: 5 },
    paragraph: { marginBottom: 10, textAlign: 'justify' },
    bold: { fontFamily: 'Helvetica-Bold' },
    signatureBlock: { marginTop: 50, flexContent: 'center', alignItems: 'center' },
    signatureLine: { width: '60%', borderTop: '1px solid #000', marginTop: 40, marginBottom: 5 },
    signatureText: { fontSize: 10, textAlign: 'center' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#888', borderTop: '1px solid #ccc', paddingTop: 10 }
});

interface ContractSection {
    id: string;
    title: string;
    content: string;
}

interface ContratoPDFProps {
    inquilino: { nome: string; cpf: string; rg: string; email: string; telefone: string; };
    imovel: { rua: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string; };
    imobiliariaPerfil?: any;
    sections?: ContractSection[];
}

export const ContratoPDF = ({ inquilino, imovel, imobiliariaPerfil, sections }: ContratoPDFProps) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const enderecoCompleto = `${imovel.rua}, nº ${imovel.numero}${imovel.complemento ? ` - ${imovel.complemento}` : ''}, ${imovel.bairro}, ${imovel.cidade}/${imovel.estado} - CEP: ${imovel.cep}`;

    const replaceVariables = (text: string) => {
        return text
            .replace(/\{\{inquilino_nome\}\}/g, inquilino.nome)
            .replace(/\{\{inquilino_cpf\}\}/g, inquilino.cpf)
            .replace(/\{\{inquilino_rg\}\}/g, inquilino.rg)
            .replace(/\{\{inquilino_email\}\}/g, inquilino.email)
            .replace(/\{\{inquilino_telefone\}\}/g, inquilino.telefone)
            .replace(/\{\{endereco_imovel\}\}/g, enderecoCompleto)
            .replace(/\{\{data_atual\}\}/g, dataAtual)
            .replace(/\{\{cidade_estado\}\}/g, `${imovel.cidade}/${imovel.estado}`);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    {imobiliariaPerfil?.logo_url && (
                        <Image src={imobiliariaPerfil.logo_url} style={styles.logo} />
                    )}
                    <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS - ENTREGA FACILITADA</Text>
                </View>

                {sections && sections.length > 0 ? (
                    sections.map((section) => (
                        <View key={section.id}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.paragraph}>{replaceVariables(section.content)}</Text>
                        </View>
                    ))
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>1. AS PARTES</Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.bold}>CONTRATANTE (LOCATÁRIO): </Text>
                            {inquilino.nome}, inscrito(a) no CPF sob o nº {inquilino.cpf}, portador(a) do RG nº {inquilino.rg}, e-mail {inquilino.email},
                            telefone {inquilino.telefone}.
                        </Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.bold}>CONTRADA (ENTREGA FACILITADA): </Text>
                            ENTREGA FACILITADA GESTAO E TECNOLOGIA LTDA, pessoa jurídica de direito privado, operadora da solução tecnológica para garantia locatícia e serviços de vistoria.
                        </Text>

                        <Text style={styles.sectionTitle}>2. O OBJETO</Text>
                        <Text style={styles.paragraph}>
                            O presente contrato tem como objeto a prestação de serviços de garantia e intermediação tecnológica "Entrega Facilitada" referente ao imóvel objeto da locação situado no endereço:
                        </Text>
                        <Text style={[styles.paragraph, styles.bold]}>{enderecoCompleto}</Text>

                        <Text style={styles.sectionTitle}>3. DOS SERVIÇOS E OBRIGAÇÕES</Text>
                        <Text style={styles.paragraph}>
                            Cláusula 3.1: A CONTRATADA compromete-se a fornecer a gestão da vistoria de entrada e saída, e garantia jurídica das condições de encerramento da locação.
                        </Text>
                        <Text style={styles.paragraph}>
                            Cláusula 3.2: O CONTRATANTE reconhece como válidas as vistorias geradas através da plataforma da CONTRATADA.
                        </Text>
                        <Text style={styles.paragraph}>
                            Cláusula 3.3: Como contraprestação, o CONTRATANTE realizará o pagamento das mensalidades ou anuidades configuradas em sistema, cuja inadimplência implicará em suspensão dos serviços e comunicação direta aos proprietários/imobiliária administradora.
                        </Text>

                        <Text style={styles.sectionTitle}>4. ASSINATURA ELETRÔNICA</Text>
                        <Text style={styles.paragraph}>
                            As partes acordam e reconhecem a validade da assinatura eletrônica por meio da plataforma Autentique, nos termos da Medida Provisória nº 2.200-2/2001, que instituiu a Infra-Estrutura de Chaves Públicas Brasileira (ICP-Brasil).
                        </Text>
                    </>
                )}

                <Text style={{ marginTop: 30, marginBottom: 50, textAlign: 'center' }}>
                    {imovel.cidade} - {imovel.estado}, {dataAtual}.
                </Text>

                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={[styles.signatureText, styles.bold]}>{inquilino.nome}</Text>
                    <Text style={styles.signatureText}>CPF: {inquilino.cpf}</Text>
                    <Text style={styles.signatureText}>Locatário(a)</Text>
                </View>

                <Text style={styles.footer} fixed>
                    Documento gerado digitalmente pela plataforma Entrega Facilitada.
                    As assinaturas são verificadas eletronicamente.
                </Text>
            </Page>
        </Document>
    );
};
