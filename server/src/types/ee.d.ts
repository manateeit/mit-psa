import { ComponentType } from 'react';

declare module '@ee/*' {
  const Component: ComponentType<any>;
  export default Component;
}
