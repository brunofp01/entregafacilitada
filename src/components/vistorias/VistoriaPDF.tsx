import { Document, Page, Text, View, StyleSheet, Image, Link, Font, Svg, Path, Circle } from '@react-pdf/renderer';

// Configuração de Estilos Profissionais
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#334155',
  },
  content: {
    padding: '30 40',
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

      {/* Página de Marketing Isolada para evitar página em branco fantasma */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>O jeito inteligente de encerrar seu contrato</Text>

            <View style={styles.timelineItem}>
              <View style={styles.iconBlock}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <Path d="M8 2v4M16 2v4M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M3 10h18m-5 10l2 2 4-4" />
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepPreHeader}>Etapa 3</Text>
                <Text style={styles.stepTitle}>Solicite a desocupação</Text>
                <Text style={styles.stepDescription}>Acione o app no final do contrato para agendar sua vistoria de saída 100% digital.</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.iconBlock, styles.iconBlockActive]}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                  <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM9 14l2 2 4-4" />
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepPreHeader}>Etapa 4</Text>
                <Text style={styles.stepTitle}>Vistoria e Diagnóstico Automático</Text>
                <Text style={styles.stepDescription}>Identificamos os reparos necessários e acionamos nossa rede de especialistas parceiros.</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.iconBlock, styles.iconBlockActive]}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                  <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepPreHeader}>Etapa 5</Text>
                <Text style={styles.stepTitle}>Execução Garantida</Text>
                <Text style={styles.stepDescription}>Pintura, limpeza e pequenos reparos realizados por profissionais, sem custos extras surpresa.</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.iconBlock, styles.iconBlockActive]}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Path d="M22 4L12 14.01l-3-3" />
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepPreHeader}>Etapa 6</Text>
                <Text style={styles.stepTitle}>Nada Consta Emitido</Text>
                <Text style={styles.stepDescription}>Entrega das chaves sem estresse e quitação total do contrato de locação.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rodapé fixo também na última página */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Entrega Facilitada Tecnologia</Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
