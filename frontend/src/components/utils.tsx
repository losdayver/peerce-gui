export const Empty: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
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
