import {
  ChoiceGroup,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  DropdownMenuItemType,
  getId,
  IconButton,
  Label,
  Panel,
  PanelType,
  PrimaryButton,
  TooltipHost
} from 'office-ui-fabric-react';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import { geLocale } from '../../../appLocale';
import { componentNames, eventTypes, telemetry } from '../../../telemetry';
import { loadGETheme } from '../../../themes';
import { AppTheme } from '../../../types/enums';
import { ISettingsProps } from '../../../types/settings';
import { signOut } from '../../services/actions/auth-action-creators';
import { consentToScopes } from '../../services/actions/permissions-action-creator';
import { togglePermissionsPanel } from '../../services/actions/permissions-panel-action-creator';
import { changeTheme } from '../../services/actions/theme-action-creator';
import { Permission } from '../query-runner/request/permissions';


function Settings(props: ISettingsProps) {
  const dispatch = useDispatch();
  const { permissionsPanelOpen } = useSelector((state: any) => state);
  const [themeChooserDialogHidden, hideThemeChooserDialog] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const {
    intl: { messages }
  }: any = props;

  const authenticated = useSelector((state: any) => (!!state.authToken));
  const appTheme = useSelector((state: any) => (state.theme));

  useEffect(() => {
    const menuItems: any = [
      {
        key: 'office-dev-program',
        text: messages['Office Dev Program'],
        href: `https://developer.microsoft.com/${geLocale}/office/dev-program`,
        target: '_blank',
        iconProps: {
          iconName: 'CommandPrompt',
        },
        onClick: () => trackOfficeDevProgramLinkClickEvent(),
      },
      {
        key: 'report-issue',
        text: messages['Report an Issue'],
        href: 'https://github.com/microsoftgraph/microsoft-graph-explorer-v4/issues/new/choose',
        target: '_blank',
        iconProps: {
          iconName: 'ReportWarning',
        },
      },
      {
        key: 'divider',
        text: '-',
        itemType: DropdownMenuItemType.Divider
      },
      {
        key: 'change-theme',
        text: messages['Change theme'],
        iconProps: {
          iconName: 'Color',
        },
        onClick: () => toggleThemeChooserDialogState(),
      }
    ];

    if (authenticated) {
      menuItems.push(
        {
          key: 'view-all-permissions',
          text: messages['view all permissions'],
          iconProps: {
            iconName: 'AzureKeyVault',
          },
          onClick: () => changePanelState(),
        },
        {
          key: 'sign-out',
          text: messages['sign out'],
          iconProps: {
            iconName: 'SignOut',
          },
          onClick: () => handleSignOut(),
        },
      );
    }
    setItems(menuItems);
  }, [authenticated]);

  const toggleThemeChooserDialogState = () => {
    let hidden = themeChooserDialogHidden;
    hidden = !hidden;
    hideThemeChooserDialog(hidden);
    telemetry.trackEvent(
      eventTypes.BUTTON_CLICK_EVENT,
      {
        ComponentName: componentNames.THEME_CHANGE_BUTTON
      });
  };

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const handleChangeTheme = (selectedTheme: any) => {
    const newTheme: AppTheme = selectedTheme.key;
    dispatch(changeTheme(newTheme));
    loadGETheme(newTheme);
    telemetry.trackEvent(
      eventTypes.BUTTON_CLICK_EVENT,
      {
        ComponentName: componentNames.SELECT_THEME_BUTTON,
        SelectedTheme: selectedTheme.text
      });
  };

  const changePanelState = () => {
    let open = !!permissionsPanelOpen;
    open = !open;
    dispatch(togglePermissionsPanel(open));
    setSelectedPermissions([]);
    trackSelectPermissionsButtonClickEvent();
  };

  const trackSelectPermissionsButtonClickEvent = () => {
    telemetry.trackEvent(
      eventTypes.BUTTON_CLICK_EVENT,
      {
        ComponentName: componentNames.VIEW_ALL_PERMISSIONS_BUTTON
      });
  }

  const setPermissions = (permissions: []) => {
    setSelectedPermissions(permissions);
  };

  const handleConsent = () => {
    dispatch(consentToScopes(selectedPermissions));
    setSelectedPermissions([]);
  };

  const trackOfficeDevProgramLinkClickEvent = () => {
    telemetry.trackEvent(
      eventTypes.LINK_CLICK_EVENT,
      {
        ComponentName: componentNames.OFFICE_DEV_PROGRAM_LINK
      });
  };

  const getSelectionDetails = () => {
    const selectionCount = selectedPermissions.length;

    switch (selectionCount) {
      case 0:
        return '';
      case 1:
        return `1 ${messages.selected}: ` + selectedPermissions[0];
      default:
        return `${selectionCount} ${messages.selected}`;
    }
  };

  const onRenderFooterContent = () => {
    return (
      <div>
        <Label>{getSelectionDetails()}</Label>
        <PrimaryButton
          disabled={selectedPermissions.length === 0}
          onClick={() => handleConsent()}
          style={{ marginRight: 10 }}
        >
          <FormattedMessage id='Consent' />
        </PrimaryButton>
        <DefaultButton onClick={() => changePanelState()}>
          <FormattedMessage id='Cancel' />
        </DefaultButton>
      </div>
    );
  };

  const menuProperties = {
    shouldFocusOnMount: true,
    alignTargetEdge: true,
    items
  };

  return (
    <div>
      <TooltipHost
        content={messages['More actions']}
        id={getId()}
        calloutProps={{ gapSpace: 0 }}>
        <IconButton
          ariaLabel={messages['More actions']}
          role='button'
          styles={{
            label: { marginBottom: -20 },
            icon: { marginBottom: -20 }
          }}
          menuIconProps={{ iconName: 'Settings' }}
          menuProps={menuProperties} />
      </TooltipHost>
      <div>
        <Dialog
          hidden={themeChooserDialogHidden}
          onDismiss={() => toggleThemeChooserDialogState()}
          dialogContentProps={{
            type: DialogType.normal,
            title: messages['Change theme'],
            isMultiline: false,
          }}
        >

          <ChoiceGroup
            label='Pick one theme'
            defaultSelectedKey={appTheme}
            options={[
              {
                key: AppTheme.Light,
                iconProps: { iconName: 'Light' },
                text: messages.Light
              },
              {
                key: AppTheme.Dark,
                iconProps: { iconName: 'CircleFill' },
                text: messages.Dark
              },
              {
                key: AppTheme.HighContrast,
                iconProps: { iconName: 'Contrast' },
                text: messages['High Contrast'],
              }
            ]}
            onChange={(event, selectedTheme) => handleChangeTheme(selectedTheme)}
          />
          <DialogFooter>
            <DefaultButton
              text={messages.Close}
              onClick={() => toggleThemeChooserDialogState()} />
          </DialogFooter>
        </Dialog>

        <Panel
          isOpen={permissionsPanelOpen}
          onDismiss={() => changePanelState()}
          type={PanelType.medium}
          hasCloseButton={true}
          headerText={messages.Permissions}
          onRenderFooterContent={onRenderFooterContent}
          isFooterAtBottom={true}
          closeButtonAriaLabel='Close'
        >
          <Permission panel={true} setPermissions={setPermissions} />
        </Panel>
      </div>
    </div>
  );
}

export default injectIntl(Settings);
