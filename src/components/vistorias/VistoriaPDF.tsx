import { Document, Page, Text, View, StyleSheet, Image, Link, Font, Svg, Path, Circle } from '@react-pdf/renderer';

// Configuração de Estilos Profissionais
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 75,
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
    padding: '12 0',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 25,
    marginBottom: 10,
    borderBottom: '1pt solid #E0E0E0',
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    padding: '8 10',
    borderBottom: '0.5pt solid #f3f4f6',
    alignItems: 'flex-start',
  },
  statusBadge: {
    width: 65,
    padding: '3 8',
    textAlign: 'center',
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 12,
    textTransform: 'uppercase',
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
    color: '#4A4A4A',
    fontStyle: 'italic',
    marginTop: 4,
    fontSize: 9,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
    marginBottom: 20,
    paddingLeft: 5,
    paddingRight: 5,
  },
  photoContainer: {
    width: '31.3%', // Exatamente 3 colunas por linha
    marginBottom: 15,
  },
  photo: {
    width: '100%',
    borderRadius: 4,
    border: '0.5pt solid #e5e7eb',
  },
  photoLegend: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 5,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  promoBanner: {
    marginTop: 40,
    padding: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden'
  },
  timelineLine: {
    position: 'absolute',
    left: 55,
    top: 100,
    bottom: 50,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  promoTitleContainer: {
    marginBottom: 32,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'left',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  iconBlock: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5A524',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#F5A524',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  stepContent: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 2,
  },
  stepPreHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 10,
    gap: 10,
  },
  footerLogo: {
    width: 25,
    height: 25,
    objectFit: 'contain',
  },
  footerSales: {
    fontSize: 9,
    color: '#52525B',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    maxWidth: '70%',
  },
  footerPage: {
    fontSize: 9,
    color: '#71717A',
    width: 60,
    textAlign: 'right',
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
            <View key={aIdx} style={{ marginBottom: 20 }}>
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
                    switch (status) {
                      case 'Novo': return { bg: 'rgba(209, 250, 229, 0.4)', text: '#065f46' }; // Green
                      case 'Bom': return { bg: 'rgba(219, 234, 254, 0.4)', text: '#1e40af' }; // Blue
                      case 'Regular': return { bg: 'rgba(254, 249, 195, 0.4)', text: '#854d0e' }; // Yellow
                      case 'Ruim': return { bg: 'rgba(254, 226, 226, 0.4)', text: '#991b1b' }; // Red
                      default: return { bg: 'rgba(243, 244, 246, 0.4)', text: '#374151' };
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

        {/* Selo de Fechamento (Timeline Estilo Landing Page) */}
        <View style={styles.promoBanner} wrap={false}>
          <View style={styles.timelineLine} />

          <View style={styles.promoTitleContainer}>
            <Text style={styles.promoTitle}>
              Veja como funciona com a <Text style={{ color: '#3b82f6' }}>Entrega Facilitada</Text>:
            </Text>
          </View>

          <View style={[styles.timelineItem, { marginBottom: 24, alignItems: 'center' }]}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F5A524', borderWidth: 2, borderColor: '#F8FAFC', zIndex: 10, position: 'absolute', left: 49 }} />
            <Text style={[styles.stepPreHeader, { color: '#F5A524', marginLeft: 84, marginTop: 4, letterSpacing: 1.5 }]}>DAQUI EM DIANTE É COM A ENTREGA FACILITADA ↓</Text>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.iconBlock}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
                <Path d="m9 14 2 2 4-4" />
              </Svg>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepPreHeader}>Etapa 4</Text>
              <Text style={styles.stepTitle}>Vistoria e diagnóstico</Text>
              <Text style={styles.stepDescription}>Nossa equipe realiza a vistoria, documenta o estado do imóvel e gera o orçamento dos reparos cobertos.</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.iconBlock}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
                <Path d="M9 8c-2 3-4 3.5-7 4l8 8c.5-3 1-5 4-7" />
              </Svg>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepPreHeader}>Etapa 5</Text>
              <Text style={styles.stepTitle}>Execução dos reparos</Text>
              <Text style={styles.stepDescription}>Profissionais credenciados cuidam de pintura, limpeza e reparos — tudo dentro do pacote contratado.</Text>
            </View>
          </View>

          <View style={[styles.timelineItem, { marginBottom: 0 }]}>
            <View style={styles.iconBlock}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
                <Path d="m21 2-9.6 9.6" />
                <Circle cx="7.5" cy="15.5" r="5.5" />
              </Svg>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepPreHeader}>Etapa 6</Text>
              <Text style={styles.stepTitle}>Chaves entregues, Nada Consta emitido</Text>
              <Text style={styles.stepDescription}>Certificado automático de quitação. Entregue as chaves sem estresse e sem cobranças extras.</Text>
            </View>
          </View>
        </View>

        {/* Rodapé Fixo (Footer Universal) - 3 Colunas: Logo | Texto Interativo Centrado | Página */}
        <View style={styles.footer} fixed>
          <Image src="https://entregafacilitada.vercel.app/favicon.png" style={styles.footerLogo} />
          <View style={styles.footerSales}>
            <Text>Entrega Facilitada: Da contratação à desocupação descomplicada.</Text>
            <Link src="https://entregafacilitada.vercel.app/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              <Text>Acesse: entregafacilitada.vercel.app</Text>
            </Link>
          </View>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};
