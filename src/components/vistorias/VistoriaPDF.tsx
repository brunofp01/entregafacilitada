import { Document, Page, Text, View, StyleSheet, Image, Link, Font, Svg, Path, Circle } from '@react-pdf/renderer';

// Configuração de Estilos Profissionais
const styles = StyleSheet.create({
  page: {
    padding: 0,
    paddingTop: 30,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#334155',
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 40,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25 40',
    backgroundColor: '#F8FAFC',
    borderBottom: '1pt solid #E2E8F0',
  },
  partnerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  partnerLogo: {
    width: 100,
    height: 50,
    objectFit: 'contain',
  },
  partnerInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  agencyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  agencyDetails: {
    fontSize: 7,
    color: '#475569',
    lineHeight: 1.3,
  },
  techSection: {
    alignItems: 'flex-end',
  },
  techLabel: {
    fontSize: 7,
    color: '#94A3B8',
    marginBottom: 4,
  },
  brandingEf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  logoEf: {
    width: 16,
    height: 16,
    objectFit: 'contain',
  },
  brandTextEf: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  brandTextPart2: {
    color: '#F6A823',
  },
  efUrl: {
    fontSize: 8,
    color: '#F6A823',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  docHeader: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'black',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  docSubtitle: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    border: '1pt solid #E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  propertyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  propertyRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  label: {
    width: 70,
    fontWeight: 'bold',
    color: '#94A3B8',
    fontSize: 8,
  },
  value: {
    flex: 1,
    color: '#1E293B',
    fontSize: 9,
    fontWeight: 'medium',
  },
  meterSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  meterCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  meterIcon: {
    width: 20,
    height: 20,
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  meterValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  meterPhoto: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    borderRadius: 6,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: '8 15',
    marginVertical: 15,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    padding: '8 15',
    borderBottom: '0.5pt solid #F1F5F9',
    alignItems: 'center',
  },
  statusBadge: {
    width: 65,
    padding: '4 0',
    textAlign: 'center',
    borderRadius: 6,
    fontSize: 7,
    fontWeight: 'bold',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
    paddingTop: 2,
  },
  itemName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  itemObs: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  photoRefsText: {
    fontSize: 8,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
    padding: '0 5',
  },
  photoContainer: {
    width: '31.3%',
    marginBottom: 10,
    border: '1pt solid #E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
  },
  photoLegendBox: {
    backgroundColor: '#F8FAFC',
    padding: 5,
    borderTop: '1pt solid #E2E8F0',
  },
  photoLegend: {
    fontSize: 6,
    textAlign: 'center',
    color: '#64748B',
    fontWeight: 'bold',
  },
  promoBanner: {
    padding: 30,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    color: '#FFFFFF',
    marginTop: 20,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  iconBlock: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  iconBlockActive: {
    backgroundColor: '#F5A524',
  },
  stepContent: {
    flex: 1,
  },
  stepPreHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  stepDescription: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 1.4,
  },
  marketingPage: {
    padding: 0,
    backgroundColor: '#0D1117',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#FFFFFF',
  },
  marketingContent: {
    padding: '60 50',
    flex: 1,
  },
  marketingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 1.2,
  },
  marketingSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 1.4,
    paddingHorizontal: 40,
  },
  timelineContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  marketingTimelineItem: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 25,
  },
  marketingIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(246, 168, 35, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketingStepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F6A823',
    marginBottom: 6,
  },
  marketingStepDesc: {
    fontSize: 10,
    color: '#CBD5E1',
    lineHeight: 1.5,
  },
  ctaCard: {
    marginTop: 'auto',
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 30,
    border: '1pt solid #30363D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  ctaTextContent: {
    flex: 1,
  },
  ctaHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#F6A823',
    padding: '12 25',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
  },
  ctaButtonText: {
    color: '#0D1117',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  qrSection: {
    alignItems: 'center',
    gap: 10,
  },
  qrCodeBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrUrl: {
    fontSize: 7,
    color: '#94A3B8',
    textDecoration: 'none',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '15 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTop: '1pt solid #E2E8F0',
  },
  footerText: {
    fontSize: 8,
    color: '#64748B',
  },
  footerPage: {
    fontSize: 8,
    color: '#94A3B8',
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
  metragem?: number;
  tipo?: string;
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

  return (
    <Document title={`Laudo de Vistoria - ${data.rua}`}>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho Bifurcado v4 com Link Clicável */}
        <View style={styles.header}>
          {/* Lado Esquerdo - O Protagonista B2B */}
          <View style={styles.partnerSection}>
            {data.perfil?.logo_url ? (
              <Image src={data.perfil.logo_url} style={styles.partnerLogo} />
            ) : (
              <View style={[styles.partnerLogo, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }]}>
                <Text style={{ fontSize: 8, color: '#94A3B8', fontWeight: 'bold' }}>LOGO</Text>
              </View>
            )}
            <View style={styles.partnerInfo}>
              <Text style={styles.agencyName}>{data.perfil?.nome_fantasia || 'Imobiliária Parceira'}</Text>
              <Text style={styles.agencyDetails}>CNPJ: {data.perfil?.cnpj || 'Consulte Imobiliária'}</Text>
              <Text style={styles.agencyDetails}>{data.perfil?.endereco_completo || 'Endereço não informado'}</Text>
              <Text style={styles.agencyDetails}>{data.perfil?.email || 'Contato via sistema'}</Text>
            </View>
          </View>

          {/* Lado Direito - O Selo de Tecnologia com Link */}
          <View style={styles.techSection}>
            <Text style={styles.techLabel}>Laudo gerado via tecnologia Entrega Facilitada</Text>
            <View style={styles.brandingEf}>
              <Image src="https://entregafacilitada.vercel.app/favicon.png" style={styles.logoEf} />
              <Text style={styles.brandTextEf}>
                Entrega <Text style={styles.brandTextPart2}>Facilitada</Text>
              </Text>
            </View>
            <Link src="https://entregafacilitada.vercel.app/" style={styles.efUrl}>
              entregafacilitada.vercel.app
            </Link>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>Laudo de Vistoria</Text>
            <Text style={styles.docSubtitle}>Registro Fotográfico e Técnico do Imóvel</Text>
          </View>

          {/* Info do Imóvel */}
          <View style={styles.propertyCard}>
            <Text style={styles.propertyTitle}>Identificação do Imóvel</Text>
            <View style={{ marginBottom: 12 }}>
              <View style={styles.propertyRow}>
                <Text style={styles.label}>Endereço:</Text>
                <Text style={styles.value}>{fullAddress}</Text>
              </View>
              <View style={styles.propertyRow}>
                <Text style={styles.label}>Data:</Text>
                <Text style={styles.value}>{displayDate}</Text>
              </View>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.label}>Metragem:</Text>
              <Text style={styles.value}>{data.metragem ? `${data.metragem} m²` : '--'}</Text>
              <Text style={[styles.label, { width: 40, marginLeft: 20 }]}>Tipo:</Text>
              <Text style={[styles.value, { textTransform: 'capitalize' }]}>{data.tipo || '--'}</Text>
            </View>
          </View>

          {/* Medidores com Ícones */}
          <View style={styles.meterSection}>
            {['agua', 'luz', 'gas'].map((key) => (
              <View key={key} style={styles.meterCard}>
                <View style={styles.meterIcon}>
                  {key === 'agua' && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </Svg>
                  )}
                  {key === 'luz' && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </Svg>
                  )}
                  {key === 'gas' && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <Path d="M12 2c0 10-6 12-6 12s6 2 6 8c0-6 6-8 6-8s-6-2-6-12z" />
                    </Svg>
                  )}
                </View>
                <Text style={styles.meterLabel}>{key === 'agua' ? 'Água' : key === 'luz' ? 'Energia' : 'Gás'}</Text>
                <Text style={styles.meterValue}>{data.medidores[key].leitura || '--'}</Text>
                {data.medidores[key].foto && <Image src={data.medidores[key].foto} style={styles.meterPhoto} />}
              </View>
            ))}
          </View>

          {/* Relatório por Ambiente */}
          {data.ambientes.map((ambiente, aIdx) => {
            let internalPhotoCounter = 0;
            return (
              <View key={aIdx} style={{ marginBottom: 20 }}>
                <View style={[styles.sectionDivider, { marginTop: aIdx === 0 ? 0 : 30 }]}>
                  <Text style={styles.sectionTitle}>{ambiente.nome}</Text>
                </View>

                {/* Itens do Ambiente com Referência de Fotos */}
                <View>
                  {ambiente.itens.map((item, iIdx) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'Novo':
                        case 'Bom': return { bg: '#DCFCE7', text: '#166534' };
                        case 'Regular': return { bg: '#FEF9C3', text: '#854D0E' };
                        case 'Ruim': return { bg: '#FEE2E2', text: '#991B1B' };
                        default: return { bg: '#F1F5F9', text: '#475569' };
                      }
                    };
                    const colors = getStatusColor(item.estado);

                    const itemPhotos = [];
                    if (item.fotos.length > 0) {
                      for (let p = 0; p < item.fotos.length; p++) {
                        internalPhotoCounter++;
                        itemPhotos.push(`FOTO ${internalPhotoCounter}`);
                      }
                    }

                    return (
                      <View key={iIdx} style={styles.itemRow} wrap={false}>
                        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                          <Text style={{ color: colors.text }}>{item.estado.toUpperCase()}</Text>
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemObs}>
                            <Text style={styles.itemName}>{item.nome}: </Text>
                            Obs: {item.observacao || 'Nenhuma observação técnica.'}
                            {itemPhotos.length > 0 && (
                              <Text style={styles.photoRefsText}>
                                {" "}(Ver {itemPhotos.join(', ')})
                              </Text>
                            )}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Grid de Fotos 3 Colunas */}
                {ambiente.itens.some(i => i.fotos.length > 0) && (
                  <View style={styles.photoGrid}>
                    {(() => {
                      let gridCounter = 0;
                      return ambiente.itens.flatMap(item =>
                        item.fotos.map((foto, fIdx) => {
                          gridCounter++;
                          return (
                            <View key={`${item.id}-${fIdx}`} style={styles.photoContainer} wrap={false}>
                              <Image src={foto} style={styles.photo} />
                              <View style={styles.photoLegendBox}>
                                <Text style={styles.photoLegend}>FOTO {gridCounter} - {item.nome.toUpperCase()}</Text>
                              </View>
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
        </View>

        {/* Rodapé Fixo */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Entrega Facilitada Tecnologia</Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página de Marketing Premium (Contra-Capa) v10 */}
      <Page size="A4" style={styles.marketingPage}>
        <View style={styles.marketingContent}>
          <Text style={styles.marketingTitle}>
            Já está pensando no trabalho que vai dar para entregar o imóvel exatamente assim?
          </Text>
          <Text style={styles.marketingSubtitle}>
            A conta da vistoria final sempre chega. Mas ela não precisa ser uma surpresa e nem esvaziar o seu bolso de uma vez.
          </Text>

          <View style={styles.timelineContainer}>
            {/* Passo 1 - Escudo */}
            <View style={styles.marketingTimelineItem}>
              <View style={styles.marketingIconWrapper}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F6A823" strokeWidth="2">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketingStepTitle}>Antecipe e Proteja-se Hoje</Text>
                <Text style={styles.marketingStepDesc}>
                  Transforme os altos custos de adequação (pintura e pequenos reparos) em uma cobertura de valor fixo mensal durante a sua estadia.
                </Text>
              </View>
            </View>

            {/* Passo 2 - Casa/Sofá */}
            <View style={styles.marketingTimelineItem}>
              <View style={styles.marketingIconWrapper}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F6A823" strokeWidth="2">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <Path d="M9 22V12h6v10" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketingStepTitle}>Viva sem Preocupações</Text>
                <Text style={styles.marketingStepDesc}>
                  Aproveite sua casa nova sabendo que a dor de cabeça com pedreiros, pintores e faxina na hora da mudança já está resolvida.
                </Text>
              </View>
            </View>

            {/* Passo 3 - Chave/Check */}
            <View style={styles.marketingTimelineItem}>
              <View style={styles.marketingIconWrapper}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F6A823" strokeWidth="2">
                  <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l2.25-2.25" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketingStepTitle}>Saída Garantida</Text>
                <Text style={styles.marketingStepDesc}>
                  No fim do contrato, nós assumimos os itens estéticos do laudo. Entregamos a pintura, os reparos superficiais e a limpeza impecáveis, garantindo a aprovação destes itens sem custos extras.
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Card */}
          <View style={styles.ctaCard}>
            <View style={styles.ctaTextContent}>
              <Text style={styles.ctaHeading}>Simule agora a sua proteção e blinde a sua devolução.</Text>
              <Link src="https://entregafacilitada.vercel.app/" style={{ textDecoration: 'none' }}>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Simular Minha Entrega</Text>
                </View>
              </Link>
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrCodeBox}>
                {/* QR Code SVG Simulado */}
                <Svg width="60" height="60" viewBox="0 0 24 24">
                  <Path d="M3 3h4v4H3V3zm14 0h4v4h-4V3zM3 17h4v4H3v-4zm10-5h2v2h-2v-2zm2 2h2v2h-2v-2zm0-2h2v2h-2v-2zm2 2h2v2h-2v-2zM12 12h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zM17 12h4v4h-4v-4zm0 5h2v2h-2v-2zM5 5h2v2H5V5zm14 0h2v2h-2V5zm0 14h2v2h-2v-2zM5 19h2v2H5v-2z" fill="#0D1117" />
                </Svg>
              </View>
              <Link src="https://entregafacilitada.vercel.app/" style={styles.qrUrl}>
                entregafacilitada.vercel.app
              </Link>
            </View>
          </View>
        </View>

        {/* Rodapé customizado para Dark Mode */}
        <View style={[styles.footer, { backgroundColor: '#161B22', borderTop: '1pt solid #30363D' }]} fixed>
          <Text style={[styles.footerText, { color: '#94A3B8' }]}>© {new Date().getFullYear()} Entrega Facilitada Tecnologia</Text>
          <Text style={[styles.footerPage, { color: '#475569' }]} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
