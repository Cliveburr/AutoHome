import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  adoptDiscoveredModule,
  getOperationalModuleDetail,
  listAdministrativeRooms,
  listDiscoveredModules,
  listOperationalModules,
  setModuleConfiguration,
  updateModuleOrganization,
  type Module,
  type ModuleDetail,
  type ParameterDeclaration,
} from './api/client';

const discoveredKey = ['administration', 'discovery'] as const;
const modulesKey = ['administration', 'modules'] as const;

function moduleLabel(module: Module) {
  return module.name ?? module.protocolId;
}

function ModuleCard({
  module,
  discovered,
  onAdopt,
}: {
  module: Module;
  discovered?: boolean;
  onAdopt?: () => void;
}) {
  return (
    <li className="module-card">
      <div>
        <h3>{moduleLabel(module)}</h3>
        <p>
          {module.family} · {module.protocolId}
        </p>
        <p>
          {module.capabilities.map((capability) => capability.id).join(', ') || 'Sem capacidades'}
        </p>
      </div>
      <div className="module-card-actions">
        <span
          className={`status ${module.availability === 'online' ? 'confirmado' : 'indisponivel'}`}
        >
          {module.availability === 'online' ? 'Online' : 'Offline'}
        </span>
        {discovered ? (
          <button type="button" onClick={onAdopt}>
            Adotar
          </button>
        ) : (
          <Link
            className="button-link"
            to={`/admin/modules/${encodeURIComponent(module.protocolId)}`}
          >
            Detalhe
          </Link>
        )}
      </div>
    </li>
  );
}

export function DiscoveryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const discovery = useQuery({
    queryKey: [...discoveredKey, search, family],
    queryFn: () =>
      listDiscoveredModules({ protocolId: search || undefined, family: family || undefined }),
  });
  const adopt = useMutation({
    mutationFn: adoptDiscoveredModule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: discoveredKey });
      void queryClient.invalidateQueries({ queryKey: modulesKey });
    },
  });

  return (
    <section aria-labelledby="discovery-title">
      <h2 id="discovery-title">Descoberta</h2>
      <p>Adote módulos encontrados pela Central antes de organizá-los na residência.</p>
      <div className="filter-bar" aria-label="Filtros de descoberta">
        <label>
          Identificador
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>
          Família
          <input value={family} onChange={(event) => setFamily(event.target.value)} />
        </label>
      </div>
      {adopt.isError ? <p role="alert">Não foi possível adotar o módulo.</p> : null}
      {discovery.isLoading ? <p className="page-status">Carregando descoberta…</p> : null}
      {discovery.isError ? (
        <p className="page-status" role="alert">
          Não foi possível carregar a descoberta.
        </p>
      ) : null}
      <ul className="module-list">
        {discovery.data?.map((module) => (
          <ModuleCard
            key={module.protocolId}
            module={module}
            discovered
            onAdopt={() => adopt.mutate(module.protocolId)}
          />
        ))}
      </ul>
      {!discovery.isLoading && !discovery.data?.length ? (
        <p className="empty-state">Nenhum módulo descoberto com esses filtros.</p>
      ) : null}
    </section>
  );
}

export function ModulesPage() {
  const [family, setFamily] = useState('');
  const modules = useQuery({
    queryKey: [...modulesKey, family],
    queryFn: () => listOperationalModules(),
  });
  const filtered = modules.data?.filter((module) => !family || module.family.includes(family));
  return (
    <section aria-labelledby="modules-title">
      <h2 id="modules-title">Módulos</h2>
      <p>Módulos adotados, sua conectividade e organização na residência.</p>
      <label className="filter-control">
        Filtrar por família
        <input value={family} onChange={(event) => setFamily(event.target.value)} />
      </label>
      {modules.isLoading ? <p className="page-status">Carregando módulos…</p> : null}
      {modules.isError ? (
        <p className="page-status" role="alert">
          Não foi possível carregar os módulos.
        </p>
      ) : null}
      <ul className="module-list">
        {filtered?.map((module) => (
          <ModuleCard key={module.protocolId} module={module} />
        ))}
      </ul>
    </section>
  );
}

function ConfigurationEditor({
  protocolId,
  capabilityId,
  declaration,
  current,
}: {
  protocolId: string;
  capabilityId: string;
  declaration: ParameterDeclaration;
  current?: ModuleDetail['configurations'][number];
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(current?.desired ?? declaration.enum?.[0] ?? ''));
  const mutation = useMutation({
    mutationFn: () =>
      setModuleConfiguration(protocolId, {
        capabilityId,
        parameterKey: declaration.key,
        value:
          declaration.type === 'boolean'
            ? value === 'true'
            : declaration.type === 'number'
              ? Number(value)
              : value,
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['administration', 'module', protocolId] }),
  });
  return (
    <div className="configuration-row">
      <label>
        {declaration.key}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type={declaration.type === 'number' ? 'number' : 'text'}
        />
      </label>
      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Salvar
      </button>
      {current ? (
        <span className={`status ${current.syncStatus}`}>{current.syncStatus}</span>
      ) : null}
    </div>
  );
}

function ModuleDetailPage() {
  const { protocolId = '' } = useParams();
  const rooms = useQuery({
    queryKey: ['administration', 'rooms'],
    queryFn: listAdministrativeRooms,
  });
  const detail = useQuery({
    queryKey: ['administration', 'module', protocolId],
    queryFn: () => getOperationalModuleDetail(protocolId),
    enabled: Boolean(protocolId),
  });
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const organization = useMutation({
    mutationFn: () =>
      updateModuleOrganization(protocolId, { name: name || undefined, roomId: roomId || null }),
  });
  if (detail.isLoading) return <p className="page-status">Carregando módulo…</p>;
  if (detail.isError || !detail.data)
    return (
      <p className="page-status" role="alert">
        Módulo não encontrado.
      </p>
    );
  const module = detail.data;
  return (
    <section aria-labelledby="module-detail-title">
      <Link className="back-link" to="/admin/modules">
        Voltar para módulos
      </Link>
      <h2 id="module-detail-title">{moduleLabel(module)}</h2>
      <div className="detail-grid">
        <section className="admin-card">
          <h3>Identidade</h3>
          <p>Protocolo: {module.protocolId}</p>
          <p>Família: {module.family}</p>
          <p>Transporte: {module.transport}</p>
          <p>Disponibilidade: {module.availability}</p>
          <p>
            Estado observado:{' '}
            {module.state ? new Date(module.state.observedAt).toLocaleString() : 'não disponível'}
          </p>
        </section>
        <section className="admin-card">
          <h3>Organização</h3>
          <label>
            Nome
            <input
              value={name || module.name || ''}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Cômodo
            <select
              value={roomId || module.roomId || ''}
              onChange={(event) => setRoomId(event.target.value)}
            >
              <option value="">Sem cômodo</option>
              {rooms.data?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => organization.mutate()}
            disabled={organization.isPending}
          >
            Salvar organização
          </button>
        </section>
      </div>
      <section className="admin-card detail-section">
        <h3>Configurações</h3>
        {module.capabilities.flatMap((capability) =>
          (capability.configuration ?? []).map((declaration) => (
            <ConfigurationEditor
              key={`${capability.id}:${declaration.key}`}
              protocolId={module.protocolId}
              capabilityId={capability.id}
              declaration={declaration}
              current={module.configurations.find(
                (configuration) =>
                  configuration.capabilityId === capability.id &&
                  configuration.parameterKey === declaration.key,
              )}
            />
          )),
        )}
      </section>
    </section>
  );
}

export function AdminModulesPage() {
  return (
    <Routes>
      <Route index element={<ModulesPage />} />
      <Route path="discovery" element={<DiscoveryPage />} />
      <Route path=":protocolId" element={<ModuleDetailPage />} />
    </Routes>
  );
}
