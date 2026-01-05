import { useState } from 'react'

// ========== LOADING OVERLAY ==========
export function Loading({ message = 'Carregando...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <span style={{ color: 'var(--text-secondary)' }}>{message}</span>
    </div>
  )
}

// ========== BADGE ==========
export function Badge({ type = 'default', children }) {
  const classes = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    default: ''
  }
  
  return (
    <span className={`badge ${classes[type] || ''}`}>
      {children}
    </span>
  )
}

// ========== STAT CARD ==========
export function StatCard({ icon, value, label, color = 'green' }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

// ========== CARD ==========
export function Card({ title, actions, children }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

// ========== EMPTY STATE ==========
export function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// ========== MODAL ==========
export function Modal({ isOpen, onClose, title, children, footer, size = 'default' }) {
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ========== INPUT ==========
export function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input className="form-input" {...props} />
      {error && <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  )
}

// ========== SELECT ==========
export function Select({ label, options = [], ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select className="form-select" {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} data-extra={opt.extra}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ========== BUTTON ==========
export function Button({ 
  variant = 'primary', 
  size = 'default', 
  icon = false,
  fullWidth = false,
  children, 
  ...props 
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    icon && 'btn-icon',
    fullWidth && 'btn-full'
  ].filter(Boolean).join(' ')
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

// ========== DATA TABLE ==========
export function DataTable({ columns, data, emptyState }) {
  if (data.length === 0 && emptyState) {
    return emptyState
  }
  
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ========== PAGINATION ==========
export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null
  
  const inicio = (currentPage - 1) * itemsPerPage
  const fim = Math.min(inicio + itemsPerPage, totalItems)
  
  // Calcular páginas visíveis
  let startPage = Math.max(1, currentPage - 2)
  let endPage = Math.min(totalPages, startPage + 4)
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4)
  }
  
  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return (
    <div className="pagination">
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Anterior
      </button>
      
      {startPage > 1 && (
        <>
          <button className="pagination-btn" onClick={() => onPageChange(1)}>1</button>
          {startPage > 2 && <span className="pagination-info">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="pagination-info">...</span>}
          <button className="pagination-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}
      
      <span className="pagination-info">{inicio + 1}-{fim} de {totalItems}</span>
      
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próxima →
      </button>
    </div>
  )
}

// ========== COPY BOX ==========
export function CopyBox({ title, content, onCopy }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    onCopy?.()
  }
  
  return (
    <div className="copy-box">
      <div className="copy-box-header">
        <span className="copy-box-title">{title}</span>
        <button className="btn btn-whatsapp btn-sm" onClick={handleCopy}>
          📋 Copiar
        </button>
      </div>
      <div className="copy-box-content">{content}</div>
    </div>
  )
}
