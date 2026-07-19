export const App: React.FC = () => {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <SideBar header="Services" items={[{ title: "File Harbour" }]} />
      <ContentWindow />
    </div>
  );
};

interface SideBarProps {
  header?: React.ReactNode;
  items?: SideBarItemProps[];
}

const SideBar: React.FC<SideBarProps> = ({ header, items }) => {
  return (
    <div className="sidebar">
      {header && <div className="sidebar__header">{header}</div>}
      {items?.length && (
        <div className="sidebar__content">
          {items.map((item) => (
            <SideBarItem key={item.title} {...item} />
          ))}
        </div>
      )}
      <div className="sidebar__footer"></div>
    </div>
  );
};

interface SideBarItemProps {
  icon?: React.ReactNode;
  title: string;
}

const SideBarItem: React.FC<SideBarItemProps> = ({ title }) => {
  return <div className="sidebar__content__item">{title}</div>;
};

const ContentWindow: React.FC = () => {
  return (
    <div className="content-window">
      <Empty>Choose Service</Empty>
    </div>
  );
};

const Empty: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div
    style={{
      height: "100%",
      width: "100%",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </div>
);
