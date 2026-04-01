import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrar fontes caso queira algo mais premium (opcional)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #10b981',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 8,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#1f2937',
  },
  itemCard: {
    marginBottom: 15,
    padding: 10,
    border: '1pt solid #e5e7eb',
    borderRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemStatus: {
    fontSize: 10,
    padding: '2 5',
    borderRadius: 10,
  },
  observation: {
    fontSize: 9,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 5,
  },
  photo: {
    width: '48%', // 2 por linha
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 10,
  }
});

interface VistoriaData {
  imovel_endereco: string;
  cliente_nome: string;
  data: string;
  medidores: any;
  ambientes: {
    nome: string;
    itens: {
      nome: string;
      estado: string;
      observacao?: string;
      fotos: string[];
    }[];
  }[];
}

export const VistoriaPDF = ({ data }: { data: VistoriaData }) => (
  <Document title={`Laudo de Vistoria - ${data.imovel_endereco}`}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Laudo de Vistoria Digital</Text>
        <Text style={styles.subtitle}>{data.imovel_endereco}</Text>
      </View>

      {/* Info Geral */}
      <View style={{ marginBottom: 20 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{data.cliente_nome}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Data Realização:</Text>
          <Text style={styles.value}>{data.data}</Text>
        </View>
      </View>

      {/* Medidores */}
      <Text style={styles.sectionTitle}>Leituras de Medidores</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {['agua', 'luz', 'gas'].map((mKey) => (
          <View key={mKey} style={{ flex: 1, alignItems: 'center', border: '0.5pt solid #e5e7eb', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#4b5563', marginBottom: 2 }}>
              {mKey === 'agua' ? 'Água' : mKey === 'luz' ? 'Luz' : 'Gás'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
              {data.medidores[mKey].leitura || 'N/A'}
            </Text>
            {data.medidores[mKey].foto ? (
              <Image src={data.medidores[mKey].foto} style={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 2 }} />
            ) : (
              <View style={{ width: '100%', height: 80, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>Sem foto</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Ambientes e Itens */}
      {data.ambientes.map((ambiente, idx) => (
        <View key={idx} break={idx > 0 && idx % 2 === 0}>
          <Text style={styles.sectionTitle}>{ambiente.nome}</Text>
          {ambiente.itens.map((item, iIdx) => (
            <View key={iIdx} style={styles.itemCard} wrap={false}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={[styles.itemStatus, { backgroundColor: item.estado === 'Novo' ? '#d1fae5' : '#fee2e2' }]}>
                  {item.estado}
                </Text>
              </View>
              {item.observacao && <Text style={styles.observation}>Obs: {item.observacao}</Text>}
              
              {item.fotos.length > 0 && (
                <View style={styles.photoGrid}>
                  {item.fotos.map((foto, fIdx) => (
                    <Image key={fIdx} src={foto} style={styles.photo} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages} - Gerado por Entrega Facilitada`
      )} fixed />
    </Page>
  </Document>
);
