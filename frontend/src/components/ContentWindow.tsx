import { useContext } from "react";
import { Empty } from "./misc";
import { ContentWindowHeaderAction, sidebarContext } from "./sideBar";
import { Button } from "./intrinsic/button";

export const ContentWindow: React.FC = () => {
  const sideBarCtx = useContext(sidebarContext);
  const activeItem = sideBarCtx?.getActiveItem();

  const ContentCmp = activeItem?.content;
  const headerActions = activeItem?.headerActions;

  return (
    <div className="content-window">
      {!activeItem && <Empty>Choose Service</Empty>}
      {!!activeItem && (
        <ContentWrap title={activeItem?.title} headerActions={headerActions}>
          {ContentCmp ? <ContentCmp /> : null}
        </ContentWrap>
      )}
    </div>
  );
};

interface ContentWrapProps {
  title: string;
  headerActions?: ContentWindowHeaderAction[];
}

export const ContentWrap: React.FC<
  React.PropsWithChildren<ContentWrapProps>
> = ({ title, headerActions, children }) => {
  return (
    <div className="content-wrap">
      <div className="content-wrap__header">
        <div className="content-wrap__header-title">{title}</div>
        {!!headerActions?.length && (
          <div className="content-wrap__header-actions">
            {headerActions.map((action) => (
              <Button
                key={action.title}
                onClick={() => action.fn?.()}
              >
                {action.title}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="content-wrap__body">{children}</div>
    </div>
  );
};
