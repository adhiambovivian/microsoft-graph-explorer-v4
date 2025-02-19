import {
  ReactPlugin,
  withAITracking,
} from '@microsoft/applicationinsights-react-js';
import {
  ApplicationInsights,
  SeverityLevel,
} from '@microsoft/applicationinsights-web';
import { ComponentType } from 'react';
import { validateExternalLink } from '../app/utils/external-link-validation';
import { sanitizeQueryUrl } from '../app/utils/query-url-sanitization';
import { IQuery } from '../types/query-runner';
import { LINK_CLICK_EVENT, TAB_CLICK_EVENT } from './event-types';
import {
  addCommonTelemetryItemProperties,
  filterRemoteDependencyData,
  filterTelemetryTypes,
  sanitizeTelemetryItemUriProperty,
} from './filters';
import ITelemetry from './ITelemetry';

class Telemetry implements ITelemetry {
  private appInsights: ApplicationInsights;
  private config: any;
  private reactPlugin: any;

  constructor() {
    this.reactPlugin = new ReactPlugin();

    this.config = {
      instrumentationKey: this.getInstrumentationKey(),
      disableExceptionTracking: true,
      disableAjaxTracking: true,
      disableFetchTracking: false, // Enables capturing of telemetry data for outgoing requests. Used with `filterRemoteDependencyData` telemetry initializer to sanitize captured data to prevent inadvertent capture of PII.
      disableTelemetry: this.getInstrumentationKey() ? false : true,
      extensions: [this.reactPlugin],
    };

    this.appInsights = new ApplicationInsights({
      config: this.config,
    });
  }

  public initialize() {
    this.appInsights.loadAppInsights();
    this.appInsights.trackPageView();
    this.appInsights.addTelemetryInitializer(filterTelemetryTypes);
    this.appInsights.addTelemetryInitializer(filterRemoteDependencyData);
    this.appInsights.addTelemetryInitializer(sanitizeTelemetryItemUriProperty);
    this.appInsights.addTelemetryInitializer(addCommonTelemetryItemProperties);
  }

  public trackEvent(name: string, properties: {}) {
    this.appInsights.trackEvent({ name, properties });
  }

  public trackException(
    error: Error,
    severityLevel: SeverityLevel,
    properties: {}
  ) {
    this.appInsights.trackException({ error, severityLevel, properties });
  }

  public trackReactComponent(
    ComponentToTrack: ComponentType,
    componentName?: string
  ): ComponentType {
    return withAITracking(this.reactPlugin, ComponentToTrack, componentName);
  }

  public trackTabClickEvent(tabKey: string, sampleQuery?: IQuery) {
    let componentName = tabKey.replace('-', ' ');
    componentName = `${componentName
      .charAt(0)
      .toUpperCase()}${componentName.slice(1)} tab`;
    const properties: { [key: string]: any } = {
      ComponentName: componentName,
    };
    if (sampleQuery) {
      const sanitizedUrl = sanitizeQueryUrl(sampleQuery.sampleUrl);
      properties.QuerySignature = `${sampleQuery.selectedVerb} ${sanitizedUrl}`;
    }
    telemetry.trackEvent(TAB_CLICK_EVENT, properties);
  }

  public trackLinkClickEvent(url: string, componentName: string) {
    telemetry.trackEvent(LINK_CLICK_EVENT, { ComponentName: componentName });
    validateExternalLink(url, componentName);
  }

  private getInstrumentationKey() {
    return (
      (window as any).InstrumentationKey ||
      process.env.REACT_APP_INSTRUMENTATION_KEY ||
      ''
    );
  }
}

export const telemetry = new Telemetry();
