
import React, { useMemo, useState } from 'react';

import type {
  Appointment,
  BusinessProfile,
  Expense,
  IconName,
  Receipt,
  Section,
} from '../../domain/models';

import { money, today } from '../../domain/utils';

import {
  buildDashboardSeries,
  type DashboardPeriod,
} from './dashboardSeries';

import { EmptyState, Icon } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';

interface DashboardProps {
  profile: BusinessProfile;
  receipts: Receipt[];
  expenses: Expense[];
  appointments: Appointment[];
  navigate: (section: Section) => void;
}

export function Dashboard({
  profile,
  receipts,
  expenses,
  appointments,
  navigate,
}: DashboardProps) {
  const [period, setPeriod] = useState<DashboardPeriod>('month');

  // Calcula as movimentações reais conforme o período selecionado.
  const series = useMemo(
    () => buildDashboardSeries(receipts, expenses, period),
    [receipts, expenses, period],
  );

  const {
    revenue,
    expenses: spent,
    maxValue,
    buckets,
  } = series;

  // Apenas recibos finalizados são considerados emitidos.
  const finalizedReceipts = receipts.filter(
    (receipt) => receipt.status === 'FINALIZADO',
  );

  // Próximos compromissos.
  const upcoming = appointments
    .filter((item) => item.date >= today())
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )
    .slice(0, 3);

  const user = profile.ownerName
    ? profile.ownerName.split(' ')[0]
    : 'por aqui';

  // Permite visualizar todos os dias do mês sem comprimir as barras.
  const chartWidth =
    buckets.length > 12
      ? '620px'
      : buckets.length > 7
        ? '420px'
        : '100%';

  // A altura de cada barra é proporcional ao maior valor do período.
  const barHeight = (value: number): string => {
    if (maxValue <= 0) return '0%';

    return `${(value / maxValue) * 100}%`;
  };

  // Escala monetária do eixo vertical.
  const axisValues = [
    maxValue,
    maxValue * 0.75,
    maxValue * 0.5,
    maxValue * 0.25,
    0,
  ];

  return (
    <div className="page">
      <PageTitle
        eyebrow="Resumo do seu negócio"
        title={`Tudo certo, ${user}.`}
        description="Uma visão tranquila do que está acontecendo hoje."
        action="Novo recibo"
        onAction={() => navigate('receipt')}
      />

      {/* Filtro de período */}
      <div className="period-switch">
        <span>Visão financeira</span>

        {(['week', 'month', 'year'] as const).map((value) => (
          <button
            key={value}
            className={period === value ? 'active' : ''}
            onClick={() => setPeriod(value)}
            aria-pressed={period === value}
          >
            {value === 'week'
              ? '7 dias'
              : value === 'month'
                ? 'Este mês'
                : 'Este ano'}
          </button>
        ))}
      </div>

      {/* Indicadores financeiros */}
      <section className="metric-grid">
        <MetricCard
          icon="wallet"
          label="Receitas"
          value={money(revenue)}
          tone="lavender"
          note={revenue ? 'recibos finalizados' : 'ainda sem receitas'}
        />

        <MetricCard
          icon="trend"
          label="Despesas"
          value={money(spent)}
          tone="coral"
          note={spent ? 'valores registrados' : 'nenhuma despesa'}
        />

        <MetricCard
          icon="target"
          label="Resultado líquido"
          value={money(revenue - spent)}
          tone="mint"
          note="receitas menos despesas"
        />

        <MetricCard
          icon="receipt"
          label="Recibos emitidos"
          value={String(finalizedReceipts.length)}
          tone="yellow"
          note="documentos finalizados"
        />
      </section>

      {/* Gráfico de movimentações reais */}
      <section className="dashboard-grid">
        <div className="card chart-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Movimento</span>
              <h2>Seu dinheiro em perspectiva</h2>
            </div>

            <span className="trend-badge">
              <Icon name="trend" size={14} />

              {revenue - spent >= 0
                ? 'saldo positivo'
                : 'revisar saldo'}
            </span>
          </div>

          <div className="chart-area">
            {/* Escala monetária */}
            <div className="chart-y" aria-hidden="true">
              {axisValues.map((value, index) => (
                <span key={index}>{money(value)}</span>
              ))}
            </div>

            {/* Barras de entradas e saídas */}
            <div className="chart-bars-scroll">
              <div
                className="chart-bars"
                style={{ minWidth: chartWidth }}
              >
                {buckets.map((bucket) => (
                  <div
                    className="bar-group"
                    key={bucket.key}
                    title={`${bucket.key}
Entradas: ${money(bucket.revenue)}
Saídas: ${money(bucket.expenses)}`}
                    aria-label={`${bucket.key}: entradas ${money(
                      bucket.revenue,
                    )}, saídas ${money(bucket.expenses)}`}
                  >
                    <div className="bar-track">
                      <div
                        className="bar revenue"
                        style={{
                          height: barHeight(bucket.revenue),
                        }}
                      />

                      <div
                        className="bar expense"
                        style={{
                          height: barHeight(bucket.expenses),
                        }}
                      />
                    </div>

                    <span>{bucket.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mensagem para períodos sem movimentação */}
          {maxValue === 0 && (
            <p className="chart-empty-note">
              Ainda não há movimentações neste período.
              As barras aparecerão conforme você registrar
              recibos e despesas.
            </p>
          )}

          {/* Legenda */}
          <div className="chart-legend">
            <span>
              <i className="legend-dot purple" />
              Entradas
            </span>

            <span>
              <i className="legend-dot coral" />
              Saídas
            </span>

            <button
              className="text-button"
              onClick={() => navigate('history')}
            >
              Ver histórico
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Agenda e atalhos */}
      <section className="dashboard-grid lower-grid">
        <div className="card upcoming-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Agenda</span>
              <h2>Próximos compromissos</h2>
            </div>

            <button
              className="icon-button"
              onClick={() => navigate('agenda')}
              aria-label="Abrir agenda"
            >
              <Icon name="arrow" />
            </button>
          </div>

          {upcoming.length ? (
            <div className="upcoming-list">
              {upcoming.map((item) => {
                const appointmentDate = new Date(
                  `${item.date}T12:00:00`,
                );

                return (
                  <div className="upcoming-item" key={item.id}>
                    <div className="date-tile">
                      <strong>
                        {appointmentDate.getDate()}
                      </strong>

                      <span>
                        {new Intl.DateTimeFormat('pt-BR', {
                          month: 'short',
                        })
                          .format(appointmentDate)
                          .replace('.', '')}
                      </span>
                    </div>

                    <div>
                      <strong>{item.description}</strong>

                      <span>
                        <Icon name="clock" size={13} />

                        {item.time}

                        {item.address
                          ? ` · ${item.address}`
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Agenda livre por enquanto"
              text="Adicione um compromisso para Júlio lembrar você."
              action="Criar agendamento"
              onAction={() => navigate('agenda')}
              mood="thinking"
            />
          )}
        </div>

        {/* Atalhos */}
        <div className="card quick-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Atalhos</span>
              <h2>O que você precisa?</h2>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate('costs')}>
              <span className="quick-icon lilac">
                <Icon name="calculator" />
              </span>

              <span>Calcular um preço</span>

              <Icon name="chevron" size={16} />
            </button>

            <button onClick={() => navigate('agenda')}>
              <span className="quick-icon blue">
                <Icon name="calendar" />
              </span>

              <span>Marcar compromisso</span>

              <Icon name="chevron" size={16} />
            </button>

            <button onClick={() => navigate('profile')}>
              <span className="quick-icon yellow">
                <Icon name="user" />
              </span>

              <span>Completar meu perfil</span>

              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Aviso de privacidade */}
      <p className="privacy-note">
        <Icon name="lock" size={14} />
        Seus dados ficam neste dispositivo. PJ OWL funciona sem depender de internet.
      </p>
    </div>
  );
}

// Componente reutilizável dos indicadores.
export function MetricCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-icon">
        <Icon name={icon} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{note}</small>
    </div>
  );
}
