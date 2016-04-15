--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: archive_registration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION archive_registration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
INSERT INTO registrations_history SELECT NEW.*;
RETURN NULL;
END;
$$;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE "SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: SequelizeMetaBackup; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE "SequelizeMetaBackup" (
    id integer NOT NULL,
    "from" character varying(255),
    "to" character varying(255)
);


--
-- Name: SequelizeMeta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "SequelizeMeta_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SequelizeMeta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "SequelizeMeta_id_seq" OWNED BY "SequelizeMetaBackup".id;


--
-- Name: access_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE access_tokens (
    id uuid NOT NULL,
    scope character varying(255) NOT NULL,
    "expirationDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" bigint NOT NULL
);


--
-- Name: batteries; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE batteries (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    "batteryPercentage" double precision NOT NULL,
    "batteryHealth" integer NOT NULL,
    plugged integer,
    temperature integer,
    "userId" bigint NOT NULL
);


--
-- Name: batteries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE batteries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batteries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE batteries_id_seq OWNED BY batteries.id;


--
-- Name: exports; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE exports (
    id integer NOT NULL,
    "exporterId" integer NOT NULL,
    "recorderId" integer NOT NULL,
    "initialDate" timestamp with time zone NOT NULL,
    "finalDate" timestamp with time zone NOT NULL,
    "expireDate" timestamp with time zone,
    status character varying(255),
    filepath character varying(255),
    filehash character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: exports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE exports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE exports_id_seq OWNED BY exports.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "isAdmin" boolean,
    lat double precision,
    lng double precision
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE groups_id_seq OWNED BY groups.id;


--
-- Name: histories; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE histories (
    id integer NOT NULL,
    "previousState" character varying(255),
    "nextState" character varying(255),
    "userId" bigint,
    date timestamp with time zone,
    extras text
);


--
-- Name: histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE histories_id_seq OWNED BY histories.id;


--
-- Name: incidentForms; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE "incidentForms" (
    id integer NOT NULL,
    date timestamp with time zone,
    address character varying(255),
    lat double precision,
    lng double precision,
    accident boolean,
    gravity integer,
    injured integer,
    fine boolean,
    "fineType" character varying(255),
    arrest boolean,
    resistance boolean,
    argument boolean,
    "useOfForce" boolean,
    "useLethalForce" boolean,
    "userId" bigint NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: incidentForms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "incidentForms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incidentForms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "incidentForms_id_seq" OWNED BY "incidentForms".id;


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE incidents (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    "userId" bigint NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL
);


--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE incidents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE incidents_id_seq OWNED BY incidents.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE locations (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    "userId" bigint NOT NULL,
    accuracy double precision,
    satellites integer,
    provider character varying(255),
    bearing double precision,
    speed double precision
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE locations_id_seq OWNED BY locations.id;


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE registrations (
    imei character varying(32) NOT NULL,
    simid character varying(32) NOT NULL,
    public_key character varying(1024) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    username character varying(255) NOT NULL,
    ipaddress character varying(32) NOT NULL
);


--
-- Name: registrations_history; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE registrations_history (
    imei character varying(32) NOT NULL,
    simid character varying(32) NOT NULL,
    public_key character varying(1024) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    username character varying(255) NOT NULL,
    ipaddress character varying(32) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE users (
    id bigint NOT NULL,
    username character varying(255) NOT NULL,
    "passwordHash" character varying(1024) NOT NULL,
    "passwordSalt" character varying(1024) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "gcmRegistration" character varying(1024),
    "isAdmin" boolean DEFAULT false NOT NULL,
    "lastLat" double precision,
    "lastLng" double precision,
    "lastLocationUpdateDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "groupId" integer,
    "profilePicture" character varying(255),
    language character varying(5),
    "rememberToken" character varying(255),
    "isEnabled" boolean DEFAULT true,
    role character varying(20)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: videos; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE videos (
    id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    duration integer NOT NULL,
    "userId" bigint NOT NULL,
    "isValid" boolean,
    filesize integer NOT NULL
);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "SequelizeMetaBackup" ALTER COLUMN id SET DEFAULT nextval('"SequelizeMeta_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY batteries ALTER COLUMN id SET DEFAULT nextval('batteries_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY exports ALTER COLUMN id SET DEFAULT nextval('exports_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY groups ALTER COLUMN id SET DEFAULT nextval('groups_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY histories ALTER COLUMN id SET DEFAULT nextval('histories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "incidentForms" ALTER COLUMN id SET DEFAULT nextval('"incidentForms_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY incidents ALTER COLUMN id SET DEFAULT nextval('incidents_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY locations ALTER COLUMN id SET DEFAULT nextval('locations_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY "SequelizeMetaBackup"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta_pkey1; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY "SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey1" PRIMARY KEY (name);


--
-- Name: access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY access_tokens
    ADD CONSTRAINT access_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 2830 (class 2606 OID 16470)
-- Name: batteries_date_userId_key; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace:
--

ALTER TABLE ONLY batteries
    ADD CONSTRAINT "batteries_date_userId_key" UNIQUE (date, "userId");


--
-- Name: batteries_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY batteries
    ADD CONSTRAINT batteries_pkey PRIMARY KEY (id);


--
-- Name: exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY exports
    ADD CONSTRAINT exports_pkey PRIMARY KEY (id);


--
-- Name: groups_name_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_name_key UNIQUE (name);


--
-- Name: groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY histories
    ADD CONSTRAINT histories_pkey PRIMARY KEY (id);


--
-- Name: incidentForms_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY "incidentForms"
    ADD CONSTRAINT "incidentForms_pkey" PRIMARY KEY (id);


--
-- Name: incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (imei);


--
-- Name: users_email_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- TOC entry 2839 (class 2606 OID 16471)
-- Name: batteries_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY batteries
    ADD CONSTRAINT "batteries_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- TOC entry 2840 (class 2606 OID 16487)
-- Name: exports_exporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY exports
    ADD CONSTRAINT "exports_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- TOC entry 2841 (class 2606 OID 16492)
-- Name: exports_recorderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY exports
    ADD CONSTRAINT "exports_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- TOC entry 2843 (class 2606 OID 16521)
-- Name: incidentForms_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY "incidentForms"
    ADD CONSTRAINT "incidentForms_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- Name: registration_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER registration_trigger AFTER INSERT OR UPDATE ON registrations FOR EACH ROW EXECUTE PROCEDURE archive_registration();


--
-- Name: incidents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY incidents
    ADD CONSTRAINT "incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

