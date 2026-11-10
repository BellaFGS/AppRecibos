import React from 'react';
import type { BusinessProfile, IconName, Section } from '../../domain/models';
import { initials, navItems } from '../../domain/utils';
import { Button, Icon, Mascot } from '../components/ui';

export function Sidebar({ active, navigate, profile }: { active: Section; navigate: (section: Section) => void; profile: BusinessProfile }) {
  return <aside className="sidebar"><div className="brand"><div className="brand-mark"><Mascot size="small" /></div><div><strong>PJ <span>OWL</span></strong><small>organize seu corre</small></div></div><div className="nav-label">Seu espaço</div><nav>{navItems.map((item) => <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'receipt' && <b>+</b>}</button>)}</nav><div className="sidebar-bottom"><div className="julio-tip"><Mascot size="small" mood="thinking" /><p>Pequenos passos, negócio mais leve.</p></div><button className="profile-shortcut" onClick={() => navigate('profile')}><div className="avatar">{initials(profile.businessName || profile.ownerName)}</div><div><strong>{profile.businessName || 'Meu negócio'}</strong><small>{profile.ownerName || 'Configure seu perfil'}</small></div><Icon name="chevron" size={16} /></button></div></aside>;
}

export function MobileHeader({ active, navigate }: { active: Section; navigate: (section: Section) => void }) {
  const label = active === 'history' ? 'Histórico' : active === 'expenses' ? 'Despesas' : navItems.find((item) => item.id === active)?.label || 'Início';
  return <><header className="mobile-header"><button className="mobile-brand" onClick={() => navigate('dashboard')}><span className="brand-mark"><Mascot size="small" /></span><strong>PJ <span>OWL</span></strong></button><button className="mobile-action" onClick={() => navigate('profile')}><Icon name="user" /></button></header><div className="mobile-page-title"><span>{label}</span><div className="mobile-line" /></div><nav className="mobile-nav">{navItems.map((item) => <button key={item.id} className={active === item.id ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => navigate(item.id)}><Icon name={item.icon} size={18} /><span>{item.label === 'Novo recibo' ? 'Novo' : item.label}</span></button>)}</nav></>;
}

export function PageTitle({ eyebrow, title, description, action, onAction, icon = 'spark' }: { eyebrow?: string; title: string; description?: string; action?: string; onAction?: () => void; icon?: IconName }) {
  return <div className="page-title"><div><div className="eyebrow"><span className="eyebrow-dot"><Icon name={icon} size={13} /></span>{eyebrow || 'PJ OWL'}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <Button icon="plus" onClick={onAction}>{action}</Button>}</div>;
}

