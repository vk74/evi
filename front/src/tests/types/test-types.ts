/**
 * Типы для тестов
 */

export interface TestComponentOptions {
  props?: Record<string, any>;
  data?: () => Record<string, any>;
  computed?: Record<string, any>;
  methods?: Record<string, any>;
  slots?: Record<string, any>;
  stubs?: Record<string, any>;
  global?: {
    plugins?: any[];
    components?: Record<string, any>;
    directives?: Record<string, any>;
    provide?: Record<string, any>;
    mocks?: Record<string, any>;
  };
}

export interface MockAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

export interface MockAxiosError {
  message: string;
  code?: string;
  response?: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  config: any;
}

export interface TestUtils {
  mountComponent: <T>(component: T, options?: TestComponentOptions) => any;
  createAxiosMock: () => any;
  createLocalStorageMock: () => any;
  createSessionStorageMock: () => any;
  waitForNextTick: () => Promise<void>;
  clearAllMocks: () => void;
}

export interface MockUtils {
  createRouterMock: () => any;
  createPiniaMock: () => any;
  createI18nMock: () => any;
  createEventMock: (type: string, options?: EventInit) => Event;
  createMouseEventMock: (type: string, options?: MouseEventInit) => MouseEvent;
  createKeyboardEventMock: (type: string, options?: KeyboardEventInit) => KeyboardEvent;
  createFormDataMock: () => any;
  createFileMock: (name: string, content: string, type?: string) => File;
  createBlobMock: (content: string, type?: string) => Blob;
}

export interface TestEnvironment {
  testUtils: TestUtils;
  mockUtils: MockUtils;
} 