import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Configuração de Estilos Profissionais
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 15,
  },
  headerLogo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  headerInfo: {
    textAlign: 'right',
    maxWidth: 250,
  },
  agencyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#142542',
    marginBottom: 4,
  },
  agencyDetails: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#142542',
    textTransform: 'uppercase',
  },
  propertyCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    border: '0.5pt solid #e5e7eb',
  },
  propertyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  propertyRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontWeight: 'bold',
    color: '#6b7280',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#111827',
    fontSize: 9,
  },
  meterSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  meterCard: {
    flex: 1,
    padding: 10,
    border: '0.5pt solid #e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  meterValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  meterPhoto: {
    width: '100%',
    height: 70,
    objectFit: 'contain',
    borderRadius: 4,
  },
  roomHeader: {
    backgroundColor: '#142542',
    color: '#ffffff',
    padding: '8 15',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    padding: '6 10',
    borderBottom: '0.5pt solid #f3f4f6',
    alignItems: 'flex-start',
  },
  statusBadge: {
    width: 60,
    padding: '2 4',
    textAlign: 'center',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 10,
  },
  itemName: {
    fontWeight: 'bold',
    color: '#111827',
  },
  itemObs: {
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
    paddingLeft: 10,
    paddingRight: 10,
  },
  photoContainer: {
    width: '23%', // 4 por linha
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 4,
    border: '0.5pt solid #e5e7eb',
  },
  photoLegend: {
    fontSize: 6,
    textAlign: 'center',
    marginTop: 3,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  promoBanner: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    border: '1pt solid #bae6fd',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  promoLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  promoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  promoText: {
    fontSize: 9,
    color: '#075985',
    lineHeight: 1.4,
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
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  created_at?: string;
  medidores: any;
  perfil?: {
    nome_fantasia: string;
    cnpj?: string;
    endereco_completo?: string;
    whatsapp?: string;
    email?: string;
    logo_url?: string;
  };
  ambientes: {
    id: string;
    nome: string;
    itens: {
      id: string;
      nome: string;
      estado: string;
      observacao?: string;
      fotos: string[];
    }[];
  }[];
}

export const VistoriaPDF = ({ data }: { data: VistoriaData }) => {
  const fullAddress = `${data.rua}, nº ${data.numero}${data.complemento ? `, ${data.complemento}` : ''} - ${data.bairro}, ${data.cidade}/${data.estado} - CEP: ${data.cep}`;
  const displayDate = data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

  // Helper para calcular IDs de fotos por ambiente
  const getPhotoId = (ambienteId: string, photoIdx: number, items: any[]) => {
    let globalCounter = 1;
    for (const item of items) {
      if (item.fotos.length > 0) {
        for (let i = 0; i < item.fotos.length; i++) {
          if (item.fotos[i] === items.find(it => it.id === item.id).fotos[photoIdx] && item.id === item.id) {
            // Este não é o jeito mais robusto de achar, vamos simplificar
          }
        }
      }
    }
    return globalCounter;
  };

  return (
    <Document title={`Laudo de Vistoria - ${data.rua}`}>
      <Page size="A4" style={styles.page}>
        {/* Pilar 3: Cabeçalho com Perfil da Imobiliária */}
        <View style={styles.header}>
          {data.perfil?.logo_url ? (
            <Image src={data.perfil.logo_url} style={styles.headerLogo} />
          ) : (
            <View style={[styles.headerLogo, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{ fontSize: 8, color: '#9ca3af' }}>Logo Imobiliária</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.agencyName}>{data.perfil?.nome_fantasia || 'Imobiliária Parceira'}</Text>
            <Text style={styles.agencyDetails}>CNPJ: {data.perfil?.cnpj || 'N/A'}</Text>
            <Text style={styles.agencyDetails}>{data.perfil?.endereco_completo || ''}</Text>
            <Text style={styles.agencyDetails}>{data.perfil?.email || ''} | {data.perfil?.whatsapp || ''}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>LAUDO DE VISTORIA RESIDENCIAL</Text>

        {/* Info do Imóvel */}
        <View style={styles.propertyCard}>
          <Text style={styles.propertyTitle}>DADOS DO IMÓVEL</Text>
          <View style={styles.propertyRow}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{fullAddress}</Text>
          </View>
          <View style={styles.propertyRow}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>{displayDate}</Text>
          </View>
        </View>

        {/* Pilar 1: Medidores */}
        <View style={styles.meterSection}>
          {['agua', 'luz', 'gas'].map((key) => (
            <View key={key} style={styles.meterCard}>
              <Text style={styles.meterLabel}>{key === 'agua' ? 'Água' : key === 'luz' ? 'Energia' : 'Gás'}</Text>
              <Text style={styles.meterValue}>{data.medidores[key].leitura || '--'}</Text>
              {data.medidores[key].foto && <Image src={data.medidores[key].foto} style={styles.meterPhoto} />}
            </View>
          ))}
        </View>

        {/* Pilar 1 & 4: Relatório por Ambiente */}
        {data.ambientes.map((ambiente, aIdx) => {
          let photoCounter = 0;
          return (
            <View key={aIdx} wrap={false} style={{ marginBottom: 20 }}>
              <Text style={styles.roomHeader}>{ambiente.nome.toUpperCase()}</Text>
              
              {/* Subseção A: Relatório Textual */}
              <View style={{ marginBottom: 10 }}>
                {ambiente.itens.map((item, iIdx) => {
                  const itemPhotoCount = item.fotos.length;
                  const photoRefs = [];
                  if (itemPhotoCount > 0) {
                    for (let p = 0; p < itemPhotoCount; p++) {
                      photoCounter++;
                      photoRefs.push(`Foto ${photoCounter}`);
                    }
                  }

                  const getStatusColor = (status: string) => {
                    switch(status) {
                      case 'Novo': return { bg: '#d1fae5', text: '#065f46' };
                      case 'Bom': return { bg: '#dcfce7', text: '#166534' };
                      case 'Regular': return { bg: '#fef9c3', text: '#854d0e' };
                      case 'Ruim': return { bg: '#fee2e2', text: '#991b1b' };
                      default: return { bg: '#f3f4f6', text: '#374151' };
                    }
                  };
                  const colors = getStatusColor(item.estado);

                  return (
                    <View key={iIdx} style={styles.itemRow}>
                      <Text style={[styles.statusBadge, { backgroundColor: colors.bg, color: colors.text }]}>
                        {item.estado.toUpperCase()}
                      </Text>
                      <View style={styles.itemText}>
                        <Text>
                          <Text style={styles.itemName}>{item.nome}</Text>
                          {photoRefs.length > 0 && <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}> (Ver {photoRefs.join(', ')})</Text>}
                        </Text>
                        {item.observacao && <Text style={styles.itemObs}>Obs: {item.observacao}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Subseção B: Grade de Fotos do Ambiente */}
              {ambiente.itens.some(i => i.fotos.length > 0) && (
                <View style={styles.photoGrid}>
                  {(() => {
                    let gridCounter = 0;
                    return ambiente.itens.flatMap(item => 
                      item.fotos.map((foto, fIdx) => {
                        gridCounter++;
                        return (
                          <View key={`${item.id}-${fIdx}`} style={styles.photoContainer}>
                            <Image src={foto} style={styles.photo} />
                            <Text style={styles.photoLegend}>Foto {gridCounter} - {item.nome}</Text>
                          </View>
                        );
                      })
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })}

        {/* Pilar 5: Rodapé de Alta Conversão */}
        <View style={styles.promoBanner} wrap={false}>
          <View style={styles.promoHeader}>
            <Image src="https://entregafacilitada.vercel.app/favicon.png" style={styles.promoLogo} />
            <Text style={styles.promoTitle}>Entrega Facilitada — Da contratação à desocupação descomplicada.</Text>
          </View>
          <Text style={styles.promoText}>
            Ao final do contrato, acione nosso app. Nós realizamos a vistoria de saída, 
            executamos os reparos com profissionais credenciados e emitimos o seu Nada Consta. 
            Entregue as chaves sem estresse e sem cobranças extras!
          </Text>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages} - Laudo Rastreável Gerado via Entrega Facilitada`
        )} fixed />
      </Page>
    </Document>
  );
};
