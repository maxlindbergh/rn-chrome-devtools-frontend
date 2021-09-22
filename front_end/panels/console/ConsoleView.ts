// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as Bindings from '../../models/bindings/bindings.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as Logs from '../../models/logs/logs.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as IssueCounter from '../../ui/components/issue_counter/issue_counter.js';
// eslint-disable-next-line rulesdir/es_modules_import
import objectValueStyles from '../../ui/legacy/components/object_ui/objectValue.css.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ConsoleContextSelector} from './ConsoleContextSelector.js';
import consoleViewStyles from './consoleView.css.js';

import type {LevelsMask} from './ConsoleFilter.js';
import {ConsoleFilter, FilterType} from './ConsoleFilter.js';
import {ConsolePinPane} from './ConsolePinPane.js';
import {ConsolePrompt, Events as ConsolePromptEvents} from './ConsolePrompt.js';
import {ConsoleSidebar, Events} from './ConsoleSidebar.js';
import {ConsoleCommand, ConsoleCommandResult, ConsoleGroupViewMessage, ConsoleTableMessageView, ConsoleViewMessage, getMessageForElement, MaxLengthForLinks} from './ConsoleViewMessage.js';

import type {ConsoleViewportElement, ConsoleViewportProvider} from './ConsoleViewport.js';
import {ConsoleViewport} from './ConsoleViewport.js';

const UIStrings = {
  /**
  *@description Label for button which links to Issues tab, specifying how many issues there are.
  */
  issuesWithColon: '{n, plural, =0 {No Issues} =1 {# Issue:} other {# Issues:}}',
  /**
  *@description Text for the tooltip of the issue counter toolbar item
  */
  issueToolbarTooltipGeneral: 'Some problems no longer generate console messages, but are surfaced in the issues tab.',
  /**
  * @description Text for the tooltip of the issue counter toolbar item. The placeholder indicates how many issues
  * there are in the Issues tab broken down by kind.
  * @example {1 page error, 2 breaking changes} issueEnumeration
  */
  issueToolbarClickToView: 'Click to view {issueEnumeration}',
  /**
  * @description Text for the tooltip of the issue counter toolbar item. The placeholder indicates how many issues
  * there are in the Issues tab broken down by kind.
  */
  issueToolbarClickToGoToTheIssuesTab: 'Click to go to the issues tab',
  /**
  *@description Text in Console View of the Console panel
  */
  findStringInLogs: 'Find string in logs',
  /**
  *@description Tooltip text that appears when hovering over the largeicon settings gear in show settings pane setting in console view of the console panel
  */
  consoleSettings: 'Console settings',
  /**
  *@description Title of a setting under the Console category that can be invoked through the Command Menu
  */
  groupSimilarMessagesInConsole: 'Group similar messages in console',
  /**
  * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
  * open/show the sidebar.
  */
  showConsoleSidebar: 'Show console sidebar',
  /**
  * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
  * open/show the sidebar.
  */
  hideConsoleSidebar: 'Hide console sidebar',
  /**
  *@description Tooltip text that appears on the setting to preserve log when hovering over the item
  */
  doNotClearLogOnPageReload: 'Do not clear log on page reload / navigation',
  /**
  *@description Text to preserve the log after refreshing
  */
  preserveLog: 'Preserve log',
  /**
  *@description Text in Console View of the Console panel
  */
  hideNetwork: 'Hide network',
  /**
  *@description Tooltip text that appears on the setting when hovering over it in Console View of the Console panel
  */
  onlyShowMessagesFromTheCurrentContext:
      'Only show messages from the current context (`top`, `iframe`, `worker`, extension)',
  /**
  *@description Alternative title text of a setting in Console View of the Console panel
  */
  selectedContextOnly: 'Selected context only',
  /**
  *@description Tooltip text that appears on the setting when hovering over it in Console View of the Console panel
  */
  eagerlyEvaluateTextInThePrompt: 'Eagerly evaluate text in the prompt',
  /**
  * @description Text in Console View of the Console panel, indicating that a number of console
  * messages have been hidden.
  */
  sHidden: '{n, plural, =1 {# hidden} other {# hidden}}',
  /**
  *@description Alert message for screen readers when the console is cleared
  */
  consoleCleared: 'Console cleared',
  /**
  *@description Text in Console View of the Console panel
  *@example {index.js} PH1
  */
  hideMessagesFromS: 'Hide messages from {PH1}',
  /**
  *@description Text to save content as a specific file type
  */
  saveAs: 'Save as...',
  /**
  *@description A context menu item in the Console View of the Console panel
  */
  copyVisibleStyledSelection: 'Copy visible styled selection',
  /**
  *@description Text to replay an XHR request
  */
  replayXhr: 'Replay XHR',
  /**
  *@description Text to indicate DevTools is writing to a file
  */
  writingFile: 'Writing file…',
  /**
  *@description Text to indicate the searching is in progress
  */
  searching: 'Searching…',
  /**
  *@description Text to filter result items
  */
  filter: 'Filter',
  /**
  *@description Text in Console View of the Console panel
  */
  egEventdCdnUrlacom: 'e.g. `/event\d/ -cdn url:a.com`',
  /**
  *@description Sdk console message message level verbose of level Labels in Console View of the Console panel
  */
  verbose: 'Verbose',
  /**
  *@description Sdk console message message level info of level Labels in Console View of the Console panel
  */
  info: 'Info',
  /**
  *@description Sdk console message message level warning of level Labels in Console View of the Console panel
  */
  warnings: 'Warnings',
  /**
  *@description Text for errors
  */
  errors: 'Errors',
  /**
  *@description Text in Console View of the Console panel
  */
  logLevels: 'Log levels',
  /**
  *@description Title text of a setting in Console View of the Console panel
  */
  overriddenByFilterSidebar: 'Overridden by filter sidebar',
  /**
  *@description Text in Console View of the Console panel
  */
  customLevels: 'Custom levels',
  /**
  *@description Text in Console View of the Console panel
  *@example {Warnings} PH1
  */
  sOnly: '{PH1} only',
  /**
  *@description Text in Console View of the Console panel
  */
  allLevels: 'All levels',
  /**
  *@description Text in Console View of the Console panel
  */
  defaultLevels: 'Default levels',
  /**
  *@description Text in Console View of the Console panel
  */
  hideAll: 'Hide all',
  /**
  *@description Title of level menu button in console view of the console panel
  *@example {All levels} PH1
  */
  logLevelS: 'Log level: {PH1}',
  /**
  *@description A context menu item in the Console View of the Console panel
  */
  default: 'Default',
  /**
  *@description Text summary to indicate total number of messages in console for accessibility/screen readers.
  *@example {5} PH1
  */
  filteredMessagesInConsole: '{PH1} messages in console',
};
const str_ = i18n.i18n.registerUIStrings('panels/console/ConsoleView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let consoleViewInstance: ConsoleView;

export class ConsoleView extends UI.Widget.VBox implements UI.SearchableView.Searchable, ConsoleViewportProvider {
  private readonly searchableViewInternal: UI.SearchableView.SearchableView;
  private readonly sidebar: ConsoleSidebar;
  private isSidebarOpen: boolean;
  private filter: ConsoleViewFilter;
  private readonly consoleToolbarContainer: HTMLElement;
  private readonly splitWidget: UI.SplitWidget.SplitWidget;
  private readonly contentsElement: UI.Widget.WidgetElement;
  private visibleViewMessages: ConsoleViewMessage[];
  private hiddenByFilterCount: number;
  private shouldBeHiddenCache: Set<ConsoleViewMessage>;
  private lastShownHiddenByFilterCount!: number;
  private currentMatchRangeIndex!: number;
  private searchRegex!: RegExp|null;
  private groupableMessages: Map<string, ConsoleViewMessage[]>;
  private readonly groupableMessageTitle: Map<string, ConsoleViewMessage>;
  private readonly shortcuts: Map<number, () => void>;
  private regexMatchRanges: RegexMatchRange[];
  private readonly consoleContextSelector: ConsoleContextSelector;
  private readonly filterStatusText: UI.Toolbar.ToolbarText;
  private readonly showSettingsPaneSetting: Common.Settings.Setting<boolean>;
  private readonly showSettingsPaneButton: UI.Toolbar.ToolbarSettingToggle;
  private readonly progressToolbarItem: UI.Toolbar.ToolbarItem;
  private readonly groupSimilarSetting: Common.Settings.Setting<boolean>;
  private readonly preserveLogCheckbox: UI.Toolbar.ToolbarSettingCheckbox;
  private readonly hideNetworkMessagesCheckbox: UI.Toolbar.ToolbarSettingCheckbox;
  private readonly timestampsSetting: Common.Settings.Setting<unknown>;
  private readonly consoleHistoryAutocompleteSetting: Common.Settings.Setting<boolean>;
  readonly pinPane: ConsolePinPane;
  private viewport: ConsoleViewport;
  private messagesElement: HTMLElement;
  private messagesCountElement: HTMLElement;
  private viewportThrottler: Common.Throttler.Throttler;
  private pendingBatchResize: boolean;
  private readonly onMessageResizedBound: (e: Common.EventTarget.EventTargetEvent<UI.TreeOutline.TreeElement>) => void;
  private topGroup: ConsoleGroup;
  private currentGroup: ConsoleGroup;
  private readonly promptElement: HTMLElement;
  private readonly linkifier: Components.Linkifier.Linkifier;
  private consoleMessages: ConsoleViewMessage[];
  private readonly viewMessageSymbol: symbol;
  private readonly consoleHistorySetting: Common.Settings.Setting<string[]>;
  private prompt: ConsolePrompt;
  private immediatelyFilterMessagesForTest?: boolean;
  private maybeDirtyWhileMuted?: boolean;
  private scheduledRefreshPromiseForTest?: Promise<void>;
  private needsFullUpdate?: boolean;
  private buildHiddenCacheTimeout?: number;
  private searchShouldJumpBackwards?: boolean;
  private searchProgressIndicator?: UI.ProgressIndicator.ProgressIndicator;
  private innerSearchTimeoutId?: number;
  private muteViewportUpdates?: boolean;
  private waitForScrollTimeout?: number;
  private issueCounter: IssueCounter.IssueCounter.IssueCounter;
  private pendingSidebarMessages: ConsoleViewMessage[] = [];
  private userHasOpenedSidebarAtLeastOnce = false;
  private issueToolbarThrottle: Common.Throttler.Throttler;
  private requestResolver = new Logs.RequestResolver.RequestResolver();
  private issueResolver = new IssuesManager.IssueResolver.IssueResolver();

  constructor() {
    super();
    this.setMinimumSize(0, 35);

    this.searchableViewInternal = new UI.SearchableView.SearchableView(this, null);
    this.searchableViewInternal.element.classList.add('console-searchable-view');
    this.searchableViewInternal.setPlaceholder(i18nString(UIStrings.findStringInLogs));
    this.searchableViewInternal.setMinimalSearchQuerySize(0);
    this.sidebar = new ConsoleSidebar();
    this.sidebar.addEventListener(Events.FilterSelected, this.onFilterChanged.bind(this));
    this.isSidebarOpen = false;
    this.filter = new ConsoleViewFilter(this.onFilterChanged.bind(this));

    this.consoleToolbarContainer = this.element.createChild('div', 'console-toolbar-container');
    this.splitWidget = new UI.SplitWidget.SplitWidget(
        true /* isVertical */, false /* secondIsSidebar */, 'console.sidebar.width', 100);
    this.splitWidget.setMainWidget(this.searchableViewInternal);
    this.splitWidget.setSidebarWidget(this.sidebar);
    this.splitWidget.show(this.element);
    this.splitWidget.hideSidebar();
    this.splitWidget.enableShowModeSaving();
    this.isSidebarOpen = this.splitWidget.showMode() === UI.SplitWidget.ShowMode.Both;
    this.filter.setLevelMenuOverridden(this.isSidebarOpen);
    this.splitWidget.addEventListener(UI.SplitWidget.Events.ShowModeChanged, event => {
      this.isSidebarOpen = event.data === UI.SplitWidget.ShowMode.Both;

      if (this.isSidebarOpen) {
        if (!this.userHasOpenedSidebarAtLeastOnce) {
          /**
           * We only want to know if the user opens the sidebar once, not how
           * many times in a given session they might open and close it, hence
           * the userHasOpenedSidebarAtLeastOnce variable to track this.
           */
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleSidebarOpened);
          this.userHasOpenedSidebarAtLeastOnce = true;
        }

        // If the user has now opened the sidebar, we need to update it, so send
        // through all the pending messages.
        this.pendingSidebarMessages.forEach(message => {
          this.sidebar.onMessageAdded(message);
        });
        this.pendingSidebarMessages = [];
      }
      this.filter.setLevelMenuOverridden(this.isSidebarOpen);
      this.onFilterChanged();
    });
    this.contentsElement = this.searchableViewInternal.element;
    this.element.classList.add('console-view');

    this.visibleViewMessages = [];
    this.hiddenByFilterCount = 0;
    this.shouldBeHiddenCache = new Set();

    this.groupableMessages = new Map();
    this.groupableMessageTitle = new Map();
    this.shortcuts = new Map();

    this.regexMatchRanges = [];

    this.consoleContextSelector = new ConsoleContextSelector();

    this.filterStatusText = new UI.Toolbar.ToolbarText();
    this.filterStatusText.element.classList.add('dimmed');
    this.showSettingsPaneSetting =
        Common.Settings.Settings.instance().createSetting('consoleShowSettingsToolbar', false);
    this.showSettingsPaneButton = new UI.Toolbar.ToolbarSettingToggle(
        this.showSettingsPaneSetting, 'largeicon-settings-gear', i18nString(UIStrings.consoleSettings));
    this.progressToolbarItem = new UI.Toolbar.ToolbarItem(document.createElement('div'));
    this.groupSimilarSetting = Common.Settings.Settings.instance().moduleSetting('consoleGroupSimilar');
    this.groupSimilarSetting.addChangeListener(() => this.updateMessageList());
    const groupSimilarToggle = new UI.Toolbar.ToolbarSettingCheckbox(
        this.groupSimilarSetting, i18nString(UIStrings.groupSimilarMessagesInConsole));

    const toolbar = new UI.Toolbar.Toolbar('console-main-toolbar', this.consoleToolbarContainer);
    toolbar.makeWrappable(true);
    const rightToolbar = new UI.Toolbar.Toolbar('', this.consoleToolbarContainer);
    toolbar.appendToolbarItem(this.splitWidget.createShowHideSidebarButton(
        i18nString(UIStrings.showConsoleSidebar), i18nString(UIStrings.hideConsoleSidebar)));
    toolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton(
        (UI.ActionRegistry.ActionRegistry.instance().action('console.clear') as UI.ActionRegistration.Action)));
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this.consoleContextSelector.toolbarItem());
    toolbar.appendSeparator();
    const liveExpressionButton = UI.Toolbar.Toolbar.createActionButton(
        (UI.ActionRegistry.ActionRegistry.instance().action('console.create-pin') as UI.ActionRegistration.Action));
    toolbar.appendToolbarItem(liveExpressionButton);
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this.filter.textFilterUI);
    toolbar.appendToolbarItem(this.filter.levelMenuButton);
    toolbar.appendToolbarItem(this.progressToolbarItem);
    toolbar.appendSeparator();
    this.issueCounter = new IssueCounter.IssueCounter.IssueCounter();
    this.issueCounter.id = 'console-issues-counter';
    const issuesToolbarItem = new UI.Toolbar.ToolbarItem(this.issueCounter);
    this.issueCounter.data = {
      clickHandler: (): void => {
        Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.StatusBarIssuesCounter);
        UI.ViewManager.ViewManager.instance().showView('issues-pane');
      },
      issuesManager: IssuesManager.IssuesManager.IssuesManager.instance(),
      accessibleName: i18nString(UIStrings.issueToolbarTooltipGeneral),
      displayMode: IssueCounter.IssueCounter.DisplayMode.OmitEmpty,
    };
    toolbar.appendToolbarItem(issuesToolbarItem);
    rightToolbar.appendSeparator();
    rightToolbar.appendToolbarItem(this.filterStatusText);
    rightToolbar.appendToolbarItem(this.showSettingsPaneButton);

    this.preserveLogCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        Common.Settings.Settings.instance().moduleSetting('preserveConsoleLog'),
        i18nString(UIStrings.doNotClearLogOnPageReload), i18nString(UIStrings.preserveLog));
    this.hideNetworkMessagesCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        this.filter.hideNetworkMessagesSetting, this.filter.hideNetworkMessagesSetting.title(),
        i18nString(UIStrings.hideNetwork));
    const filterByExecutionContextCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        this.filter.filterByExecutionContextSetting, i18nString(UIStrings.onlyShowMessagesFromTheCurrentContext),
        i18nString(UIStrings.selectedContextOnly));
    const monitoringXHREnabledSetting = Common.Settings.Settings.instance().moduleSetting('monitoringXHREnabled');
    this.timestampsSetting = Common.Settings.Settings.instance().moduleSetting('consoleTimestampsEnabled');
    this.consoleHistoryAutocompleteSetting =
        Common.Settings.Settings.instance().moduleSetting('consoleHistoryAutocomplete');

    const settingsPane = new UI.Widget.HBox();
    settingsPane.show(this.contentsElement);
    settingsPane.element.classList.add('console-settings-pane');

    UI.ARIAUtils.setAccessibleName(settingsPane.element, i18nString(UIStrings.consoleSettings));
    UI.ARIAUtils.markAsGroup(settingsPane.element);
    const settingsToolbarLeft = new UI.Toolbar.Toolbar('', settingsPane.element);
    settingsToolbarLeft.makeVertical();
    settingsToolbarLeft.appendToolbarItem(this.hideNetworkMessagesCheckbox);
    settingsToolbarLeft.appendToolbarItem(this.preserveLogCheckbox);
    settingsToolbarLeft.appendToolbarItem(filterByExecutionContextCheckbox);
    settingsToolbarLeft.appendToolbarItem(groupSimilarToggle);

    const settingsToolbarRight = new UI.Toolbar.Toolbar('', settingsPane.element);
    settingsToolbarRight.makeVertical();
    settingsToolbarRight.appendToolbarItem(new UI.Toolbar.ToolbarSettingCheckbox(monitoringXHREnabledSetting));
    const eagerEvalCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        Common.Settings.Settings.instance().moduleSetting('consoleEagerEval'),
        i18nString(UIStrings.eagerlyEvaluateTextInThePrompt));
    settingsToolbarRight.appendToolbarItem(eagerEvalCheckbox);
    settingsToolbarRight.appendToolbarItem(
        new UI.Toolbar.ToolbarSettingCheckbox(this.consoleHistoryAutocompleteSetting));
    const userGestureCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(
        Common.Settings.Settings.instance().moduleSetting('consoleUserActivationEval'));
    settingsToolbarRight.appendToolbarItem(userGestureCheckbox);
    if (!this.showSettingsPaneSetting.get()) {
      settingsPane.element.classList.add('hidden');
    }
    this.showSettingsPaneSetting.addChangeListener(
        () => settingsPane.element.classList.toggle('hidden', !this.showSettingsPaneSetting.get()));

    this.pinPane = new ConsolePinPane(liveExpressionButton);
    this.pinPane.element.classList.add('console-view-pinpane');
    this.pinPane.show(this.contentsElement);
    this.pinPane.element.addEventListener('keydown', event => {
      if ((event.key === 'Enter' &&
           UI.KeyboardShortcut.KeyboardShortcut.eventHasCtrlEquivalentKey((event as KeyboardEvent))) ||
          event.keyCode === UI.KeyboardShortcut.Keys.Esc.code) {
        this.prompt.focus();
        event.consume();
      }
    });

    this.viewport = new ConsoleViewport(this);
    this.viewport.setStickToBottom(true);
    this.viewport.contentElement().classList.add('console-group', 'console-group-messages');
    this.contentsElement.appendChild(this.viewport.element);
    this.messagesElement = this.viewport.element;
    this.messagesElement.id = 'console-messages';
    this.messagesElement.classList.add('monospace');
    this.messagesElement.addEventListener('click', this.messagesClicked.bind(this), false);
    this.messagesElement.addEventListener('paste', this.messagesPasted.bind(this), true);
    this.messagesElement.addEventListener('clipboard-paste', this.messagesPasted.bind(this), true);

    this.messagesCountElement = this.consoleToolbarContainer.createChild('div', 'message-count');
    UI.ARIAUtils.markAsPoliteLiveRegion(this.messagesCountElement, false);

    this.viewportThrottler = new Common.Throttler.Throttler(50);
    this.pendingBatchResize = false;
    this.onMessageResizedBound = (e: Common.EventTarget.EventTargetEvent<UI.TreeOutline.TreeElement>): void => {
      this.onMessageResized(e);
    };

    this.topGroup = ConsoleGroup.createTopGroup();
    this.currentGroup = this.topGroup;

    this.promptElement = this.messagesElement.createChild('div', 'source-code');
    this.promptElement.id = 'console-prompt';

    // FIXME: This is a workaround for the selection machinery bug. See crbug.com/410899
    const selectAllFixer = this.messagesElement.createChild('div', 'console-view-fix-select-all');
    selectAllFixer.textContent = '.';
    UI.ARIAUtils.markAsHidden(selectAllFixer);

    this.registerShortcuts();

    this.messagesElement.addEventListener('contextmenu', this.handleContextMenuEvent.bind(this), false);

    // Filters need to be re-applied to a console message when the message's live location changes.
    // All relevant live locations are created by the same linkifier, so it is enough to subscribe to
    // the linkifiers live location change event.
    const throttler = new Common.Throttler.Throttler(100);
    const refilterMessages = (): Promise<void> => throttler.schedule(async () => this.onFilterChanged());
    this.linkifier =
        new Components.Linkifier.Linkifier(MaxLengthForLinks, /* useLinkDecorator */ undefined, refilterMessages);

    this.consoleMessages = [];
    this.viewMessageSymbol = Symbol('viewMessage');

    this.consoleHistorySetting = Common.Settings.Settings.instance().createLocalSetting('consoleHistory', []);

    this.prompt = new ConsolePrompt();
    this.prompt.show(this.promptElement);
    this.prompt.element.addEventListener('keydown', this.promptKeyDown.bind(this), true);
    this.prompt.addEventListener(ConsolePromptEvents.TextChanged, this.promptTextChanged, this);

    this.messagesElement.addEventListener('keydown', this.messagesKeyDown.bind(this), false);
    this.prompt.element.addEventListener('focusin', () => {
      if (this.isScrolledToBottom()) {
        this.viewport.setStickToBottom(true);
      }
    });

    this.consoleHistoryAutocompleteSetting.addChangeListener(this.consoleHistoryAutocompleteChanged, this);

    const historyData = this.consoleHistorySetting.get();
    this.prompt.history().setHistoryData(historyData);
    this.consoleHistoryAutocompleteChanged();

    this.updateFilterStatus();
    this.timestampsSetting.addChangeListener(this.consoleTimestampsSettingChanged, this);

    this.registerWithMessageSink();

    UI.Context.Context.instance().addFlavorChangeListener(
        SDK.RuntimeModel.ExecutionContext, this.executionContextChanged, this);

    this.messagesElement.addEventListener(
        'mousedown', (event: Event) => this.updateStickToBottomOnPointerDown((event as MouseEvent).button === 2),
        false);
    this.messagesElement.addEventListener('mouseup', this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener('mouseleave', this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener('wheel', this.updateStickToBottomOnWheel.bind(this), false);
    this.messagesElement.addEventListener('touchstart', this.updateStickToBottomOnPointerDown.bind(this, false), false);
    this.messagesElement.addEventListener('touchend', this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener('touchcancel', this.updateStickToBottomOnPointerUp.bind(this), false);

    SDK.ConsoleModel.ConsoleModel.instance().addEventListener(
        SDK.ConsoleModel.Events.ConsoleCleared, this.consoleCleared, this);
    SDK.ConsoleModel.ConsoleModel.instance().addEventListener(
        SDK.ConsoleModel.Events.MessageAdded, this.onConsoleMessageAdded, this);
    SDK.ConsoleModel.ConsoleModel.instance().addEventListener(
        SDK.ConsoleModel.Events.MessageUpdated, this.onConsoleMessageUpdated, this);
    SDK.ConsoleModel.ConsoleModel.instance().addEventListener(
        SDK.ConsoleModel.Events.CommandEvaluated, this.commandEvaluated, this);
    SDK.ConsoleModel.ConsoleModel.instance().messages().forEach(this.addConsoleMessage, this);

    const issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
    this.issueToolbarThrottle = new Common.Throttler.Throttler(100);
    issuesManager.addEventListener(
        IssuesManager.IssuesManager.Events.IssuesCountUpdated,
        () => this.issueToolbarThrottle.schedule(async () => this.updateIssuesToolbarItem()), this);
  }

  static instance(): ConsoleView {
    if (!consoleViewInstance) {
      consoleViewInstance = new ConsoleView();
    }
    return consoleViewInstance;
  }

  static clearConsole(): void {
    SDK.ConsoleModel.ConsoleModel.instance().requestClearMessages();
  }

  private onFilterChanged(): void {
    this.filter.currentFilter.levelsMask =
        this.isSidebarOpen ? ConsoleFilter.allLevelsFilterValue() : this.filter.messageLevelFiltersSetting.get();
    this.cancelBuildHiddenCache();
    if (this.immediatelyFilterMessagesForTest) {
      for (const viewMessage of this.consoleMessages) {
        this.computeShouldMessageBeVisible(viewMessage);
      }
      this.updateMessageList();
      return;
    }
    this.buildHiddenCache(0, this.consoleMessages.slice());
  }

  private setImmediatelyFilterMessagesForTest(): void {
    this.immediatelyFilterMessagesForTest = true;
  }

  searchableView(): UI.SearchableView.SearchableView {
    return this.searchableViewInternal;
  }

  clearHistory(): void {
    this.consoleHistorySetting.set([]);
    this.prompt.history().setHistoryData([]);
  }

  private consoleHistoryAutocompleteChanged(): void {
    this.prompt.setAddCompletionsFromHistory(this.consoleHistoryAutocompleteSetting.get());
  }

  itemCount(): number {
    return this.visibleViewMessages.length;
  }

  itemElement(index: number): ConsoleViewportElement|null {
    return this.visibleViewMessages[index];
  }

  fastHeight(index: number): number {
    return this.visibleViewMessages[index].fastHeight();
  }

  minimumRowHeight(): number {
    return 16;
  }

  private registerWithMessageSink(): void {
    Common.Console.Console.instance().messages().forEach(this.addSinkMessage, this);
    Common.Console.Console.instance().addEventListener(Common.Console.Events.MessageAdded, ({data: message}) => {
      this.addSinkMessage(message);
    }, this);
  }

  private addSinkMessage(message: Common.Console.Message): void {
    let level: Protocol.Log.LogEntryLevel = Protocol.Log.LogEntryLevel.Verbose;
    switch (message.level) {
      case Common.Console.MessageLevel.Info:
        level = Protocol.Log.LogEntryLevel.Info;
        break;
      case Common.Console.MessageLevel.Error:
        level = Protocol.Log.LogEntryLevel.Error;
        break;
      case Common.Console.MessageLevel.Warning:
        level = Protocol.Log.LogEntryLevel.Warning;
        break;
    }

    const consoleMessage = new SDK.ConsoleModel.ConsoleMessage(
        null, Protocol.Log.LogEntrySource.Other, level, message.text,
        {type: SDK.ConsoleModel.FrontendMessageType.System, timestamp: message.timestamp});
    this.addConsoleMessage(consoleMessage);
  }

  private consoleTimestampsSettingChanged(): void {
    this.updateMessageList();
    this.consoleMessages.forEach(viewMessage => viewMessage.updateTimestamp());
    this.groupableMessageTitle.forEach(viewMessage => viewMessage.updateTimestamp());
  }

  private executionContextChanged(): void {
    this.prompt.clearAutocomplete();
  }

  willHide(): void {
    this.hidePromptSuggestBox();
  }

  wasShown(): void {
    super.wasShown();
    this.updateIssuesToolbarItem();
    this.viewport.refresh();
    this.registerCSSFiles([consoleViewStyles, objectValueStyles]);
  }

  focus(): void {
    if (this.viewport.hasVirtualSelection()) {
      (this.viewport.contentElement() as HTMLElement).focus();
    } else {
      this.focusPrompt();
    }
  }

  focusPrompt(): void {
    if (!this.prompt.hasFocus()) {
      const oldStickToBottom = this.viewport.stickToBottom();
      const oldScrollTop = this.viewport.element.scrollTop;
      this.prompt.focus();
      this.viewport.setStickToBottom(oldStickToBottom);
      this.viewport.element.scrollTop = oldScrollTop;
    }
  }

  restoreScrollPositions(): void {
    if (this.viewport.stickToBottom()) {
      this.immediatelyScrollToBottom();
    } else {
      super.restoreScrollPositions();
    }
  }

  onResize(): void {
    this.scheduleViewportRefresh();
    this.hidePromptSuggestBox();
    if (this.viewport.stickToBottom()) {
      this.immediatelyScrollToBottom();
    }
    for (let i = 0; i < this.visibleViewMessages.length; ++i) {
      this.visibleViewMessages[i].onResize();
    }
  }

  private hidePromptSuggestBox(): void {
    this.prompt.clearAutocomplete();
  }

  private async invalidateViewport(): Promise<void> {
    this.updateIssuesToolbarItem();
    if (this.muteViewportUpdates) {
      this.maybeDirtyWhileMuted = true;
      return;
    }
    if (this.needsFullUpdate) {
      this.updateMessageList();
      delete this.needsFullUpdate;
    } else {
      this.viewport.invalidate();
    }
    return;
  }

  private updateIssuesToolbarItem(): void {
    const manager = IssuesManager.IssuesManager.IssuesManager.instance();
    const issueEnumeration = IssueCounter.IssueCounter.getIssueCountsEnumeration(manager);
    const issuesTitleGotoIssues = manager.numberOfIssues() === 0 ?
        i18nString(UIStrings.issueToolbarClickToGoToTheIssuesTab) :
        i18nString(UIStrings.issueToolbarClickToView, {issueEnumeration});
    const issuesTitleGeneral = i18nString(UIStrings.issueToolbarTooltipGeneral);
    const issuesTitle = `${issuesTitleGeneral} ${issuesTitleGotoIssues}`;
    UI.Tooltip.Tooltip.install(this.issueCounter, issuesTitle);
    this.issueCounter.data = {
      ...this.issueCounter.data,
      leadingText: i18nString(UIStrings.issuesWithColon, {n: manager.numberOfIssues()}),
      accessibleName: issuesTitle,
    };
  }

  private scheduleViewportRefresh(): void {
    if (this.muteViewportUpdates) {
      this.maybeDirtyWhileMuted = true;
      this.scheduleViewportRefreshForTest(true);
      return;
    }
    this.scheduleViewportRefreshForTest(false);

    this.scheduledRefreshPromiseForTest = this.viewportThrottler.schedule(this.invalidateViewport.bind(this));
  }

  private scheduleViewportRefreshForTest(_muted: boolean): void {
    // This functions is sniffed in tests.
  }

  private immediatelyScrollToBottom(): void {
    // This will scroll viewport and trigger its refresh.
    this.viewport.setStickToBottom(true);
    this.promptElement.scrollIntoView(true);
  }

  private updateFilterStatus(): void {
    if (this.hiddenByFilterCount === this.lastShownHiddenByFilterCount) {
      return;
    }
    this.filterStatusText.setText(i18nString(UIStrings.sHidden, {n: this.hiddenByFilterCount}));
    this.filterStatusText.setVisible(Boolean(this.hiddenByFilterCount));
    this.lastShownHiddenByFilterCount = this.hiddenByFilterCount;
  }

  private onConsoleMessageAdded(event: Common.EventTarget.EventTargetEvent<SDK.ConsoleModel.ConsoleMessage>): void {
    const message = event.data;
    this.addConsoleMessage(message);
  }

  private addConsoleMessage(message: SDK.ConsoleModel.ConsoleMessage): void {
    const viewMessage = this.createViewMessage(message);
    consoleMessageToViewMessage.set(message, viewMessage);
    if (message.type === SDK.ConsoleModel.FrontendMessageType.Command ||
        message.type === SDK.ConsoleModel.FrontendMessageType.Result) {
      const lastMessage = this.consoleMessages[this.consoleMessages.length - 1];
      const newTimestamp = lastMessage && messagesSortedBySymbol.get(lastMessage) || 0;
      messagesSortedBySymbol.set(viewMessage, newTimestamp);
    } else {
      messagesSortedBySymbol.set(viewMessage, viewMessage.consoleMessage().timestamp);
    }

    let insertAt;
    if (!this.consoleMessages.length ||
        timeComparator(viewMessage, this.consoleMessages[this.consoleMessages.length - 1]) > 0) {
      insertAt = this.consoleMessages.length;
    } else {
      insertAt = Platform.ArrayUtilities.upperBound(this.consoleMessages, viewMessage, timeComparator);
    }
    const insertedInMiddle = insertAt < this.consoleMessages.length;
    this.consoleMessages.splice(insertAt, 0, viewMessage);

    this.filter.onMessageAdded(message);
    if (this.isSidebarOpen) {
      this.sidebar.onMessageAdded(viewMessage);
    } else {
      this.pendingSidebarMessages.push(viewMessage);
    }

    // If we already have similar messages, go slow path.
    let shouldGoIntoGroup = false;
    const shouldGroupSimilar = this.groupSimilarSetting.get();
    if (message.isGroupable()) {
      const groupKey = viewMessage.groupKey();
      shouldGoIntoGroup = shouldGroupSimilar && this.groupableMessages.has(groupKey);
      let list = this.groupableMessages.get(groupKey);
      if (!list) {
        list = [];
        this.groupableMessages.set(groupKey, list);
      }
      list.push(viewMessage);
    }

    this.computeShouldMessageBeVisible(viewMessage);
    if (!shouldGoIntoGroup && !insertedInMiddle) {
      this.appendMessageToEnd(
          viewMessage,
          !shouldGroupSimilar /* crbug.com/1082963: prevent collapse of same messages when "Group similar" is false */);
      this.updateFilterStatus();
      this.searchableViewInternal.updateSearchMatchesCount(this.regexMatchRanges.length);
    } else {
      this.needsFullUpdate = true;
    }

    this.scheduleViewportRefresh();
    this.consoleMessageAddedForTest(viewMessage);

    function timeComparator(viewMessage1: ConsoleViewMessage, viewMessage2: ConsoleViewMessage): number {
      return (messagesSortedBySymbol.get(viewMessage1) || 0) - (messagesSortedBySymbol.get(viewMessage2) || 0);
    }
  }

  private onConsoleMessageUpdated(event: Common.EventTarget.EventTargetEvent<SDK.ConsoleModel.ConsoleMessage>): void {
    const message = event.data;
    const viewMessage = consoleMessageToViewMessage.get(message);
    if (viewMessage) {
      viewMessage.updateMessageElement();
      this.computeShouldMessageBeVisible(viewMessage);
      this.updateMessageList();
    }
  }

  private consoleMessageAddedForTest(_viewMessage: ConsoleViewMessage): void {
  }

  private shouldMessageBeVisible(viewMessage: ConsoleViewMessage): boolean {
    return !this.shouldBeHiddenCache.has(viewMessage);
  }

  private computeShouldMessageBeVisible(viewMessage: ConsoleViewMessage): void {
    if (this.filter.shouldBeVisible(viewMessage) &&
        (!this.isSidebarOpen || this.sidebar.shouldBeVisible(viewMessage))) {
      this.shouldBeHiddenCache.delete(viewMessage);
    } else {
      this.shouldBeHiddenCache.add(viewMessage);
    }
  }

  private appendMessageToEnd(viewMessage: ConsoleViewMessage, preventCollapse?: boolean): void {
    if (!this.shouldMessageBeVisible(viewMessage)) {
      this.hiddenByFilterCount++;
      return;
    }

    if (!preventCollapse &&
        this.tryToCollapseMessages(viewMessage, this.visibleViewMessages[this.visibleViewMessages.length - 1])) {
      return;
    }

    const lastMessage = this.visibleViewMessages[this.visibleViewMessages.length - 1];
    if (viewMessage.consoleMessage().type === Protocol.Runtime.ConsoleAPICalledEventType.EndGroup) {
      if (lastMessage && !this.currentGroup.messagesHidden()) {
        lastMessage.incrementCloseGroupDecorationCount();
      }
      this.currentGroup = this.currentGroup.parentGroup() || this.currentGroup;
      return;
    }
    if (!this.currentGroup.messagesHidden()) {
      const originatingMessage = viewMessage.consoleMessage().originatingMessage();
      if (lastMessage && originatingMessage && lastMessage.consoleMessage() === originatingMessage) {
        viewMessage.toMessageElement().classList.add('console-adjacent-user-command-result');
      }

      this.visibleViewMessages.push(viewMessage);
      this.searchMessage(this.visibleViewMessages.length - 1);
    }

    if (viewMessage.consoleMessage().isGroupStartMessage()) {
      this.currentGroup = new ConsoleGroup(this.currentGroup, (viewMessage as ConsoleGroupViewMessage));
    }

    this.messageAppendedForTests();
  }

  private messageAppendedForTests(): void {
    // This method is sniffed in tests.
  }

  private createViewMessage(message: SDK.ConsoleModel.ConsoleMessage): ConsoleViewMessage {
    const nestingLevel = this.currentGroup.nestingLevel();
    switch (message.type) {
      case SDK.ConsoleModel.FrontendMessageType.Command:
        return new ConsoleCommand(
            message, this.linkifier, this.requestResolver, this.issueResolver, nestingLevel,
            this.onMessageResizedBound);
      case SDK.ConsoleModel.FrontendMessageType.Result:
        return new ConsoleCommandResult(
            message, this.linkifier, this.requestResolver, this.issueResolver, nestingLevel,
            this.onMessageResizedBound);
      case Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed:
      case Protocol.Runtime.ConsoleAPICalledEventType.StartGroup:
        return new ConsoleGroupViewMessage(
            message, this.linkifier, this.requestResolver, this.issueResolver, nestingLevel,
            this.updateMessageList.bind(this), this.onMessageResizedBound);
      case Protocol.Runtime.ConsoleAPICalledEventType.Table:
        return new ConsoleTableMessageView(
            message, this.linkifier, this.requestResolver, this.issueResolver, nestingLevel,
            this.onMessageResizedBound);
      default:
        return new ConsoleViewMessage(
            message, this.linkifier, this.requestResolver, this.issueResolver, nestingLevel,
            this.onMessageResizedBound);
    }
  }

  private async onMessageResized(event: Common.EventTarget.EventTargetEvent<UI.TreeOutline.TreeElement>):
      Promise<void> {
    const treeElement = event.data;
    if (this.pendingBatchResize || !treeElement.treeOutline) {
      return;
    }
    this.pendingBatchResize = true;
    await Promise.resolve();
    const treeOutlineElement = treeElement.treeOutline.element;
    this.viewport.setStickToBottom(this.isScrolledToBottom());
    // Scroll, in case mutations moved the element below the visible area.
    if (treeOutlineElement.offsetHeight <= this.messagesElement.offsetHeight) {
      treeOutlineElement.scrollIntoViewIfNeeded();
    }

    this.pendingBatchResize = false;
  }

  private consoleCleared(): void {
    const hadFocus = this.viewport.element.hasFocus();
    this.cancelBuildHiddenCache();
    this.currentMatchRangeIndex = -1;
    this.consoleMessages = [];
    this.groupableMessages.clear();
    this.groupableMessageTitle.clear();
    this.sidebar.clear();
    this.updateMessageList();
    this.hidePromptSuggestBox();
    this.viewport.setStickToBottom(true);
    this.linkifier.reset();
    this.filter.clear();
    this.requestResolver.clear();
    if (hadFocus) {
      this.prompt.focus();
    }
    UI.ARIAUtils.alert(i18nString(UIStrings.consoleCleared));
  }

  private handleContextMenuEvent(event: Event): void {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    const eventTarget = (event.target as Node);
    if (eventTarget.isSelfOrDescendant(this.promptElement)) {
      contextMenu.show();
      return;
    }

    const sourceElement = eventTarget.enclosingNodeOrSelfWithClass('console-message-wrapper');
    const consoleViewMessage = sourceElement && getMessageForElement(sourceElement);
    const consoleMessage = consoleViewMessage ? consoleViewMessage.consoleMessage() : null;

    if (consoleMessage && consoleMessage.url) {
      const menuTitle = i18nString(
          UIStrings.hideMessagesFromS, {PH1: new Common.ParsedURL.ParsedURL(consoleMessage.url).displayName});
      contextMenu.headerSection().appendItem(
          menuTitle, this.filter.addMessageURLFilter.bind(this.filter, consoleMessage.url));
    }

    contextMenu.defaultSection().appendAction('console.clear');
    contextMenu.defaultSection().appendAction('console.clear.history');
    contextMenu.saveSection().appendItem(i18nString(UIStrings.saveAs), this.saveConsole.bind(this));
    if (this.element.hasSelection()) {
      contextMenu.clipboardSection().appendItem(
          i18nString(UIStrings.copyVisibleStyledSelection), this.viewport.copyWithStyles.bind(this.viewport));
    }

    if (consoleMessage) {
      const request = Logs.NetworkLog.NetworkLog.requestForConsoleMessage(consoleMessage);
      if (request && SDK.NetworkManager.NetworkManager.canReplayRequest(request)) {
        contextMenu.debugSection().appendItem(
            i18nString(UIStrings.replayXhr), SDK.NetworkManager.NetworkManager.replayRequest.bind(null, request));
      }
    }

    contextMenu.show();
  }

  private async saveConsole(): Promise<void> {
    const url = (SDK.TargetManager.TargetManager.instance().mainTarget() as SDK.Target.Target).inspectedURL();
    const parsedURL = Common.ParsedURL.ParsedURL.fromString(url);
    const filename = Platform.StringUtilities.sprintf('%s-%d.log', parsedURL ? parsedURL.host : 'console', Date.now());
    const stream = new Bindings.FileUtils.FileOutputStream();

    const progressIndicator = new UI.ProgressIndicator.ProgressIndicator();
    progressIndicator.setTitle(i18nString(UIStrings.writingFile));
    progressIndicator.setTotalWork(this.itemCount());

    const chunkSize = 350;

    if (!await stream.open(filename)) {
      return;
    }
    this.progressToolbarItem.element.appendChild(progressIndicator.element);

    let messageIndex = 0;
    while (messageIndex < this.itemCount() && !progressIndicator.isCanceled()) {
      const messageContents = [];
      let i;
      for (i = 0; i < chunkSize && i + messageIndex < this.itemCount(); ++i) {
        const message = (this.itemElement(messageIndex + i) as ConsoleViewMessage);
        messageContents.push(message.toExportString());
      }
      messageIndex += i;
      await stream.write(messageContents.join('\n') + '\n');
      progressIndicator.setWorked(messageIndex);
    }

    stream.close();
    progressIndicator.done();
  }

  private tryToCollapseMessages(viewMessage: ConsoleViewMessage, lastMessage?: ConsoleViewMessage): boolean {
    const timestampsShown = this.timestampsSetting.get();
    if (!timestampsShown && lastMessage && !viewMessage.consoleMessage().isGroupMessage() &&
        viewMessage.consoleMessage().type !== SDK.ConsoleModel.FrontendMessageType.Command &&
        viewMessage.consoleMessage().type !== SDK.ConsoleModel.FrontendMessageType.Result &&
        viewMessage.consoleMessage().isEqual(lastMessage.consoleMessage())) {
      lastMessage.incrementRepeatCount();
      if (viewMessage.isLastInSimilarGroup()) {
        lastMessage.setInSimilarGroup(true, true);
      }
      return true;
    }

    return false;
  }

  private buildHiddenCache(startIndex: number, viewMessages: ConsoleViewMessage[]): void {
    const startTime = Date.now();
    let i;
    for (i = startIndex; i < viewMessages.length; ++i) {
      this.computeShouldMessageBeVisible(viewMessages[i]);
      if (i % 10 === 0 && Date.now() - startTime > 12) {
        break;
      }
    }

    if (i === viewMessages.length) {
      this.updateMessageList();
      return;
    }
    this.buildHiddenCacheTimeout =
        this.element.window().requestAnimationFrame(this.buildHiddenCache.bind(this, i, viewMessages));
  }

  private cancelBuildHiddenCache(): void {
    this.shouldBeHiddenCache.clear();
    if (this.buildHiddenCacheTimeout) {
      this.element.window().cancelAnimationFrame(this.buildHiddenCacheTimeout);
      delete this.buildHiddenCacheTimeout;
    }
  }

  private updateMessageList(): void {
    this.topGroup = ConsoleGroup.createTopGroup();
    this.currentGroup = this.topGroup;
    this.regexMatchRanges = [];
    this.hiddenByFilterCount = 0;
    for (const visibleViewMessage of this.visibleViewMessages) {
      visibleViewMessage.resetCloseGroupDecorationCount();
      visibleViewMessage.resetIncrementRepeatCount();
    }
    this.visibleViewMessages = [];
    if (this.groupSimilarSetting.get()) {
      this.addGroupableMessagesToEnd();
    } else {
      for (const consoleMessage of this.consoleMessages) {
        consoleMessage.setInSimilarGroup(false);
        this.appendMessageToEnd(
            consoleMessage,
            true /* crbug.com/1082963: prevent collapse of same messages when "Group similar" is false */);
      }
    }
    this.updateFilterStatus();
    this.searchableViewInternal.updateSearchMatchesCount(this.regexMatchRanges.length);
    this.viewport.invalidate();
    this.messagesCountElement.setAttribute(
        'aria-label', i18nString(UIStrings.filteredMessagesInConsole, {PH1: this.visibleViewMessages.length}));
  }

  private addGroupableMessagesToEnd(): void {
    const alreadyAdded = new Set<SDK.ConsoleModel.ConsoleMessage>();
    const processedGroupKeys = new Set<string>();
    for (const viewMessage of this.consoleMessages) {
      const message = viewMessage.consoleMessage();
      if (alreadyAdded.has(message)) {
        continue;
      }

      if (!message.isGroupable()) {
        this.appendMessageToEnd(viewMessage);
        alreadyAdded.add(message);
        continue;
      }

      const key = viewMessage.groupKey();
      const viewMessagesInGroup = this.groupableMessages.get(key);
      if (!viewMessagesInGroup || viewMessagesInGroup.length < 5) {
        viewMessage.setInSimilarGroup(false);
        this.appendMessageToEnd(viewMessage);
        alreadyAdded.add(message);
        continue;
      }

      if (processedGroupKeys.has(key)) {
        continue;
      }

      if (!viewMessagesInGroup.find(x => this.shouldMessageBeVisible(x))) {
        // Optimize for speed.
        // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
        // @ts-expect-error
        Platform.SetUtilities.addAll(alreadyAdded, viewMessagesInGroup);
        processedGroupKeys.add(key);
        continue;
      }

      // Create artificial group start and end messages.
      let startGroupViewMessage = this.groupableMessageTitle.get(key);
      if (!startGroupViewMessage) {
        const startGroupMessage = new SDK.ConsoleModel.ConsoleMessage(
            null, message.source, message.level, viewMessage.groupTitle(),
            {type: Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed});
        startGroupViewMessage = this.createViewMessage(startGroupMessage);
        this.groupableMessageTitle.set(key, startGroupViewMessage);
      }
      startGroupViewMessage.setRepeatCount(viewMessagesInGroup.length);
      this.appendMessageToEnd(startGroupViewMessage);

      for (const viewMessageInGroup of viewMessagesInGroup) {
        viewMessageInGroup.setInSimilarGroup(
            true, viewMessagesInGroup[viewMessagesInGroup.length - 1] === viewMessageInGroup);
        this.appendMessageToEnd(viewMessageInGroup, true);
        alreadyAdded.add(viewMessageInGroup.consoleMessage());
      }

      const endGroupMessage = new SDK.ConsoleModel.ConsoleMessage(
          null, message.source, message.level, message.messageText,
          {type: Protocol.Runtime.ConsoleAPICalledEventType.EndGroup});
      this.appendMessageToEnd(this.createViewMessage(endGroupMessage));
    }
  }

  private messagesClicked(event: Event): void {
    const target = (event.target as Node | null);
    // Do not focus prompt if messages have selection.
    if (!this.messagesElement.hasSelection()) {
      const clickedOutsideMessageList =
          target === this.messagesElement || this.prompt.belowEditorElement().isSelfOrAncestor(target);
      if (clickedOutsideMessageList) {
        this.prompt.moveCaretToEndOfPrompt();
        this.focusPrompt();
      }
    }
  }

  private messagesKeyDown(event: Event): void {
    const keyEvent = (event as KeyboardEvent);
    const hasActionModifier = keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey;
    if (hasActionModifier || keyEvent.key.length !== 1 || UI.UIUtils.isEditing() ||
        this.messagesElement.hasSelection()) {
      return;
    }
    this.prompt.moveCaretToEndOfPrompt();
    this.focusPrompt();
  }

  private messagesPasted(_event: Event): void {
    if (UI.UIUtils.isEditing()) {
      return;
    }
    this.prompt.focus();
  }

  private registerShortcuts(): void {
    this.shortcuts.set(
        UI.KeyboardShortcut.KeyboardShortcut.makeKey('u', UI.KeyboardShortcut.Modifiers.Ctrl),
        this.clearPromptBackwards.bind(this));
  }

  private clearPromptBackwards(): void {
    this.prompt.setText('');
  }

  private promptKeyDown(event: Event): void {
    const keyboardEvent = (event as KeyboardEvent);
    if (keyboardEvent.key === 'PageUp') {
      this.updateStickToBottomOnWheel();
      return;
    }

    const shortcut = UI.KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent(keyboardEvent);
    const handler = this.shortcuts.get(shortcut);
    if (handler) {
      handler();
      keyboardEvent.preventDefault();
    }
  }

  private printResult(
      result: SDK.RemoteObject.RemoteObject|null, originatingConsoleMessage: SDK.ConsoleModel.ConsoleMessage,
      exceptionDetails?: Protocol.Runtime.ExceptionDetails): void {
    if (!result) {
      return;
    }

    const level = Boolean(exceptionDetails) ? Protocol.Log.LogEntryLevel.Error : Protocol.Log.LogEntryLevel.Info;
    let message;
    if (!exceptionDetails) {
      message = new SDK.ConsoleModel.ConsoleMessage(
          result.runtimeModel(), Protocol.Log.LogEntrySource.Javascript, level, '',
          {type: SDK.ConsoleModel.FrontendMessageType.Result, parameters: [result]});
    } else {
      message = SDK.ConsoleModel.ConsoleMessage.fromException(
          result.runtimeModel(), exceptionDetails, SDK.ConsoleModel.FrontendMessageType.Result, undefined, undefined);
    }
    message.setOriginatingMessage(originatingConsoleMessage);
    SDK.ConsoleModel.ConsoleModel.instance().addMessage(message);
  }

  private commandEvaluated(event: Common.EventTarget.EventTargetEvent<SDK.ConsoleModel.CommandEvaluatedEvent>): void {
    const {data} = event;
    this.prompt.history().pushHistoryItem(data.commandMessage.messageText);
    this.consoleHistorySetting.set(this.prompt.history().historyData().slice(-persistedHistorySize));
    this.printResult(data.result, data.commandMessage, data.exceptionDetails);
  }

  elementsToRestoreScrollPositionsFor(): Element[] {
    return [this.messagesElement];
  }

  searchCanceled(): void {
    this.cleanupAfterSearch();
    for (const message of this.visibleViewMessages) {
      message.setSearchRegex(null);
    }
    this.currentMatchRangeIndex = -1;
    this.regexMatchRanges = [];
    this.searchRegex = null;
    this.viewport.refresh();
  }

  performSearch(searchConfig: UI.SearchableView.SearchConfig, shouldJump: boolean, jumpBackwards?: boolean): void {
    this.searchCanceled();
    this.searchableViewInternal.updateSearchMatchesCount(0);

    this.searchRegex = searchConfig.toSearchRegex(true);

    this.regexMatchRanges = [];
    this.currentMatchRangeIndex = -1;

    if (shouldJump) {
      this.searchShouldJumpBackwards = Boolean(jumpBackwards);
    }

    this.searchProgressIndicator = new UI.ProgressIndicator.ProgressIndicator();
    this.searchProgressIndicator.setTitle(i18nString(UIStrings.searching));
    this.searchProgressIndicator.setTotalWork(this.visibleViewMessages.length);
    this.progressToolbarItem.element.appendChild(this.searchProgressIndicator.element);

    this.innerSearch(0);
  }

  private cleanupAfterSearch(): void {
    delete this.searchShouldJumpBackwards;
    if (this.innerSearchTimeoutId) {
      clearTimeout(this.innerSearchTimeoutId);
      delete this.innerSearchTimeoutId;
    }
    if (this.searchProgressIndicator) {
      this.searchProgressIndicator.done();
      delete this.searchProgressIndicator;
    }
  }

  private searchFinishedForTests(): void {
    // This method is sniffed in tests.
  }

  private innerSearch(index: number): void {
    delete this.innerSearchTimeoutId;
    if (this.searchProgressIndicator && this.searchProgressIndicator.isCanceled()) {
      this.cleanupAfterSearch();
      return;
    }

    const startTime = Date.now();
    for (; index < this.visibleViewMessages.length && Date.now() - startTime < 100; ++index) {
      this.searchMessage(index);
    }

    this.searchableViewInternal.updateSearchMatchesCount(this.regexMatchRanges.length);
    if (typeof this.searchShouldJumpBackwards !== 'undefined' && this.regexMatchRanges.length) {
      this.jumpToMatch(this.searchShouldJumpBackwards ? -1 : 0);
      delete this.searchShouldJumpBackwards;
    }

    if (index === this.visibleViewMessages.length) {
      this.cleanupAfterSearch();
      setTimeout(this.searchFinishedForTests.bind(this), 0);
      return;
    }

    this.innerSearchTimeoutId = window.setTimeout(this.innerSearch.bind(this, index), 100);
    if (this.searchProgressIndicator) {
      this.searchProgressIndicator.setWorked(index);
    }
  }

  private searchMessage(index: number): void {
    const message = this.visibleViewMessages[index];
    message.setSearchRegex(this.searchRegex);
    for (let i = 0; i < message.searchCount(); ++i) {
      this.regexMatchRanges.push({messageIndex: index, matchIndex: i});
    }
  }

  jumpToNextSearchResult(): void {
    this.jumpToMatch(this.currentMatchRangeIndex + 1);
  }

  jumpToPreviousSearchResult(): void {
    this.jumpToMatch(this.currentMatchRangeIndex - 1);
  }

  supportsCaseSensitiveSearch(): boolean {
    return true;
  }

  supportsRegexSearch(): boolean {
    return true;
  }

  private jumpToMatch(index: number): void {
    if (!this.regexMatchRanges.length) {
      return;
    }

    let matchRange;
    if (this.currentMatchRangeIndex >= 0) {
      matchRange = this.regexMatchRanges[this.currentMatchRangeIndex];
      const message = this.visibleViewMessages[matchRange.messageIndex];
      message.searchHighlightNode(matchRange.matchIndex)
          .classList.remove(UI.UIUtils.highlightedCurrentSearchResultClassName);
    }

    index = Platform.NumberUtilities.mod(index, this.regexMatchRanges.length);
    this.currentMatchRangeIndex = index;
    this.searchableViewInternal.updateCurrentMatchIndex(index);
    matchRange = this.regexMatchRanges[index];
    const message = this.visibleViewMessages[matchRange.messageIndex];
    const highlightNode = message.searchHighlightNode(matchRange.matchIndex);
    highlightNode.classList.add(UI.UIUtils.highlightedCurrentSearchResultClassName);
    this.viewport.scrollItemIntoView(matchRange.messageIndex);
    highlightNode.scrollIntoViewIfNeeded();
  }

  private updateStickToBottomOnPointerDown(isRightClick?: boolean): void {
    this.muteViewportUpdates = !isRightClick;
    this.viewport.setStickToBottom(false);
    if (this.waitForScrollTimeout) {
      clearTimeout(this.waitForScrollTimeout);
      delete this.waitForScrollTimeout;
    }
  }

  private updateStickToBottomOnPointerUp(): void {
    if (!this.muteViewportUpdates) {
      return;
    }

    // Delay querying isScrolledToBottom to give time for smooth scroll
    // events to arrive. The value for the longest timeout duration is
    // retrieved from crbug.com/575409.
    this.waitForScrollTimeout = window.setTimeout(updateViewportState.bind(this), 200);

    function updateViewportState(this: ConsoleView): void {
      this.muteViewportUpdates = false;
      if (this.isShowing()) {
        this.viewport.setStickToBottom(this.isScrolledToBottom());
      }
      if (this.maybeDirtyWhileMuted) {
        this.scheduleViewportRefresh();
        delete this.maybeDirtyWhileMuted;
      }
      delete this.waitForScrollTimeout;
      this.updateViewportStickinessForTest();
    }
  }

  private updateViewportStickinessForTest(): void {
    // This method is sniffed in tests.
  }

  private updateStickToBottomOnWheel(): void {
    this.updateStickToBottomOnPointerDown();
    this.updateStickToBottomOnPointerUp();
  }

  private promptTextChanged(): void {
    const oldStickToBottom = this.viewport.stickToBottom();
    const willStickToBottom = this.isScrolledToBottom();
    this.viewport.setStickToBottom(willStickToBottom);
    if (willStickToBottom && !oldStickToBottom) {
      this.scheduleViewportRefresh();
    }
    this.promptTextChangedForTest();
  }

  private promptTextChangedForTest(): void {
    // This method is sniffed in tests.
  }

  private isScrolledToBottom(): boolean {
    const distanceToPromptEditorBottom = this.messagesElement.scrollHeight - this.messagesElement.scrollTop -
        this.messagesElement.clientHeight - (this.prompt.belowEditorElement() as HTMLElement).offsetHeight;
    return distanceToPromptEditorBottom <= 2;
  }
}

// @ts-ignore exported for Tests.js
globalThis.Console = globalThis.Console || {};
// @ts-ignore exported for Tests.js
globalThis.Console.ConsoleView = ConsoleView;

const persistedHistorySize = 300;

export class ConsoleViewFilter {
  private readonly filterChanged: () => void;
  messageLevelFiltersSetting: Common.Settings.Setting<LevelsMask>;
  hideNetworkMessagesSetting: Common.Settings.Setting<boolean>;
  filterByExecutionContextSetting: Common.Settings.Setting<boolean>;
  private readonly suggestionBuilder: UI.FilterSuggestionBuilder.FilterSuggestionBuilder;
  readonly textFilterUI: UI.Toolbar.ToolbarInput;
  private readonly textFilterSetting: Common.Settings.Setting<string>;
  private readonly filterParser: TextUtils.TextUtils.FilterParser;
  currentFilter: ConsoleFilter;
  private levelLabels: Map<Protocol.Log.LogEntryLevel, string>;
  readonly levelMenuButton: UI.Toolbar.ToolbarButton;

  constructor(filterChangedCallback: () => void) {
    this.filterChanged = filterChangedCallback;

    this.messageLevelFiltersSetting = ConsoleViewFilter.levelFilterSetting();
    this.hideNetworkMessagesSetting = Common.Settings.Settings.instance().moduleSetting('hideNetworkMessages');
    this.filterByExecutionContextSetting =
        Common.Settings.Settings.instance().moduleSetting('selectedContextFilterEnabled');

    this.messageLevelFiltersSetting.addChangeListener(this.onFilterChanged.bind(this));
    this.hideNetworkMessagesSetting.addChangeListener(this.onFilterChanged.bind(this));
    this.filterByExecutionContextSetting.addChangeListener(this.onFilterChanged.bind(this));
    UI.Context.Context.instance().addFlavorChangeListener(
        SDK.RuntimeModel.ExecutionContext, this.onFilterChanged, this);

    const filterKeys = Object.values(FilterType);
    this.suggestionBuilder = new UI.FilterSuggestionBuilder.FilterSuggestionBuilder(filterKeys);
    this.textFilterUI = new UI.Toolbar.ToolbarInput(
        i18nString(UIStrings.filter), '', 1, 1, i18nString(UIStrings.egEventdCdnUrlacom),
        this.suggestionBuilder.completions.bind(this.suggestionBuilder), true);
    this.textFilterSetting = Common.Settings.Settings.instance().createSetting('console.textFilter', '');
    if (this.textFilterSetting.get()) {
      this.textFilterUI.setValue(this.textFilterSetting.get());
    }
    this.textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, () => {
      this.textFilterSetting.set(this.textFilterUI.value());
      this.onFilterChanged();
    });
    this.filterParser = new TextUtils.TextUtils.FilterParser(filterKeys);
    this.currentFilter = new ConsoleFilter('', [], null, this.messageLevelFiltersSetting.get());
    this.updateCurrentFilter();
    this.levelLabels = new Map(([
      [Protocol.Log.LogEntryLevel.Verbose, i18nString(UIStrings.verbose)],
      [Protocol.Log.LogEntryLevel.Info, i18nString(UIStrings.info)],
      [Protocol.Log.LogEntryLevel.Warning, i18nString(UIStrings.warnings)],
      [Protocol.Log.LogEntryLevel.Error, i18nString(UIStrings.errors)],
    ]));

    this.levelMenuButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.logLevels));
    this.levelMenuButton.turnIntoSelect();
    this.levelMenuButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.showLevelContextMenu.bind(this));
    UI.ARIAUtils.markAsMenuButton(this.levelMenuButton.element);

    this.updateLevelMenuButtonText();
    this.messageLevelFiltersSetting.addChangeListener(this.updateLevelMenuButtonText.bind(this));
  }

  onMessageAdded(message: SDK.ConsoleModel.ConsoleMessage): void {
    if (message.type === SDK.ConsoleModel.FrontendMessageType.Command ||
        message.type === SDK.ConsoleModel.FrontendMessageType.Result || message.isGroupMessage()) {
      return;
    }
    if (message.context) {
      this.suggestionBuilder.addItem(FilterType.Context, message.context);
    }
    if (message.source) {
      this.suggestionBuilder.addItem(FilterType.Source, message.source);
    }
    if (message.url) {
      this.suggestionBuilder.addItem(FilterType.Url, message.url);
    }
  }

  setLevelMenuOverridden(overridden: boolean): void {
    this.levelMenuButton.setEnabled(!overridden);
    if (overridden) {
      this.levelMenuButton.setTitle(i18nString(UIStrings.overriddenByFilterSidebar));
    } else {
      this.updateLevelMenuButtonText();
    }
  }

  static levelFilterSetting(): Common.Settings.Setting<LevelsMask> {
    return Common.Settings.Settings.instance().createSetting(
        'messageLevelFilters', ConsoleFilter.defaultLevelsFilterValue());
  }

  private updateCurrentFilter(): void {
    const parsedFilters = this.filterParser.parse(this.textFilterUI.value());
    if (this.hideNetworkMessagesSetting.get()) {
      parsedFilters.push(
          {key: FilterType.Source, text: Protocol.Log.LogEntrySource.Network, negative: true, regex: undefined});
    }

    this.currentFilter.executionContext = this.filterByExecutionContextSetting.get() ?
        UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext) :
        null;
    this.currentFilter.parsedFilters = parsedFilters;
    this.currentFilter.levelsMask = this.messageLevelFiltersSetting.get();
  }

  private onFilterChanged(): void {
    this.updateCurrentFilter();
    this.filterChanged();
  }

  private updateLevelMenuButtonText(): void {
    let isAll = true;
    let isDefault = true;
    const allValue = ConsoleFilter.allLevelsFilterValue();
    const defaultValue = ConsoleFilter.defaultLevelsFilterValue();

    let text: Common.UIString.LocalizedString|null = null;
    const levels = this.messageLevelFiltersSetting.get();
    const allLevels: Protocol.EnumerableEnum<typeof Protocol.Log.LogEntryLevel> = {
      Verbose: Protocol.Log.LogEntryLevel.Verbose,
      Info: Protocol.Log.LogEntryLevel.Info,
      Warning: Protocol.Log.LogEntryLevel.Warning,
      Error: Protocol.Log.LogEntryLevel.Error,
    };
    for (const name of Object.values(allLevels)) {
      isAll = isAll && levels[name] === allValue[name];
      isDefault = isDefault && levels[name] === defaultValue[name];
      if (levels[name]) {
        text = text ? i18nString(UIStrings.customLevels) :
                      i18nString(UIStrings.sOnly, {PH1: String(this.levelLabels.get(name))});
      }
    }
    if (isAll) {
      text = i18nString(UIStrings.allLevels);
    } else if (isDefault) {
      text = i18nString(UIStrings.defaultLevels);
    } else {
      text = text || i18nString(UIStrings.hideAll);
    }
    this.levelMenuButton.element.classList.toggle('warning', !isAll && !isDefault);
    this.levelMenuButton.setText(text);
    this.levelMenuButton.setTitle(i18nString(UIStrings.logLevelS, {PH1: text}));
  }

  private showLevelContextMenu(event: Common.EventTarget.EventTargetEvent<Event>): void {
    const mouseEvent = event.data;
    const setting = this.messageLevelFiltersSetting;
    const levels = setting.get();

    const contextMenu = new UI.ContextMenu.ContextMenu(mouseEvent, {
      useSoftMenu: true,
      x: this.levelMenuButton.element.totalOffsetLeft(),
      y: this.levelMenuButton.element.totalOffsetTop() + (this.levelMenuButton.element as HTMLElement).offsetHeight,
    });
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.default), () => setting.set(ConsoleFilter.defaultLevelsFilterValue()));
    for (const [level, levelText] of this.levelLabels.entries()) {
      contextMenu.defaultSection().appendCheckboxItem(levelText, toggleShowLevel.bind(null, level), levels[level]);
    }
    contextMenu.show();

    function toggleShowLevel(level: string): void {
      levels[level] = !levels[level];
      setting.set(levels);
    }
  }

  addMessageURLFilter(url: string): void {
    if (!url) {
      return;
    }
    const suffix = this.textFilterUI.value() ? ` ${this.textFilterUI.value()}` : '';
    this.textFilterUI.setValue(`-url:${url}${suffix}`);
    this.textFilterSetting.set(this.textFilterUI.value());
    this.onFilterChanged();
  }

  shouldBeVisible(viewMessage: ConsoleViewMessage): boolean {
    return this.currentFilter.shouldBeVisible(viewMessage);
  }

  clear(): void {
    this.suggestionBuilder.clear();
  }

  reset(): void {
    this.messageLevelFiltersSetting.set(ConsoleFilter.defaultLevelsFilterValue());
    this.filterByExecutionContextSetting.set(false);
    this.hideNetworkMessagesSetting.set(false);
    this.textFilterUI.setValue('');
    this.onFilterChanged();
  }
}

export class ConsoleGroup {
  private readonly parentGroupInternal: ConsoleGroup|null;
  private readonly nestingLevelInternal: number;
  private readonly messagesHiddenInternal: boolean;

  constructor(parentGroup: ConsoleGroup|null, groupMessage: ConsoleGroupViewMessage|null) {
    this.parentGroupInternal = parentGroup;
    this.nestingLevelInternal = parentGroup ? parentGroup.nestingLevel() + 1 : 0;
    this.messagesHiddenInternal = groupMessage && groupMessage.collapsed() ||
        this.parentGroupInternal && this.parentGroupInternal.messagesHidden() || false;
  }

  static createTopGroup(): ConsoleGroup {
    return new ConsoleGroup(null, null);
  }

  messagesHidden(): boolean {
    return this.messagesHiddenInternal;
  }

  nestingLevel(): number {
    return this.nestingLevelInternal;
  }

  parentGroup(): ConsoleGroup|null {
    return this.parentGroupInternal;
  }
}

let actionDelegateInstance: ActionDelegate;

export class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
  handleAction(_context: UI.Context.Context, actionId: string): boolean {
    switch (actionId) {
      case 'console.show':
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
        Common.Console.Console.instance().show();
        ConsoleView.instance().focusPrompt();
        return true;
      case 'console.clear':
        ConsoleView.clearConsole();
        return true;
      case 'console.clear.history':
        ConsoleView.instance().clearHistory();
        return true;
      case 'console.create-pin':
        ConsoleView.instance().pinPane.addPin('', true /* userGesture */);
        return true;
    }
    return false;
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): ActionDelegate {
    const {forceNew} = opts;
    if (!actionDelegateInstance || forceNew) {
      actionDelegateInstance = new ActionDelegate();
    }

    return actionDelegateInstance;
  }
}

const messagesSortedBySymbol = new WeakMap<ConsoleViewMessage, number>();
const consoleMessageToViewMessage = new WeakMap<SDK.ConsoleModel.ConsoleMessage, ConsoleViewMessage>();
export interface RegexMatchRange {
  messageIndex: number;
  matchIndex: number;
}
