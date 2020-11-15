const Links = ({ logLinks, linkHandler }) => {
  const getLinks = (logLinks) => {
    return logLinks.map((link) => (
      <li key={link}>
        <a href={link} onClick={linkHandler}>
          {link}
        </a>
      </li>
    ));
  };

  return (
    <div className="links">
      <ul>{getLinks(logLinks)}</ul>
    </div>
  );
};

export default Links;
