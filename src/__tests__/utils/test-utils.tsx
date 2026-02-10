import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
export { default as userEvent } from '@testing-library/user-event'
