"use client";

import { cadCatalog } from "@cr/catalog";
import { useState } from "react";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { Notice } from "@/components/ui/Notice";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { useCadFlow } from "../CadFlowProvider";
import { invalidParamTabs, isReview, paramSelection, parametersBlockedReason } from "../state";

const TABS = cadCatalog.parameters.tabs;

export function ParametersStep() {
  const { state, dispatch } = useCadFlow();
  const [active, setActive] = useState(TABS[0].id);
  const invalid = invalidParamTabs(state);

  return (
    <>
      {isReview(state) ? (
        <Notice>En mode «Revisar la documentació» no cal triar com es dibuixa: només es genera un informe.</Notice>
      ) : (
        <Panel>
          <Tabs
            label="Paràmetres del modelatge"
            value={active}
            onValueChange={setActive}
            items={TABS.map((tab) => ({
              id: tab.id,
              label: tab.label,
              incomplete: invalid.includes(tab.id),
              content: (
                <>
                  {tab.groups.map((group) => (
                    <OptionGroup
                      key={group.id}
                      group={group}
                      minCardWidth={150}
                      selected={paramSelection(state, group.id)}
                      onChange={(selected) => dispatch({ type: "setParam", groupId: group.id, selected })}
                    />
                  ))}
                  {tab.note && <Notice>{tab.note}</Notice>}
                </>
              ),
            }))}
          />
        </Panel>
      )}
      <FlowFooter backHref="/cad/elements" nextHref="/cad/generate" blockedReason={parametersBlockedReason(state)} />
    </>
  );
}
