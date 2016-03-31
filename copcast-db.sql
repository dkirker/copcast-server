--
-- PostgreSQL database dump
--

-- Dumped from database version 9.2.15
-- Dumped by pg_dump version 9.2.15
-- Started on 2016-03-30 23:15:27 WEST

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 1 (class 3079 OID 12648)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2957 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 179 (class 1259 OID 16442)
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE "SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO test;

--
-- TOC entry 169 (class 1259 OID 16386)
-- Name: SequelizeMetaBackup; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE "SequelizeMetaBackup" (
    id integer NOT NULL,
    "from" character varying(255),
    "to" character varying(255)
);


ALTER TABLE public."SequelizeMetaBackup" OWNER TO test;

--
-- TOC entry 170 (class 1259 OID 16392)
-- Name: SequelizeMeta_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE "SequelizeMeta_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SequelizeMeta_id_seq" OWNER TO test;

--
-- TOC entry 2960 (class 0 OID 0)
-- Dependencies: 170
-- Name: SequelizeMeta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE "SequelizeMeta_id_seq" OWNED BY "SequelizeMetaBackup".id;


--
-- TOC entry 171 (class 1259 OID 16394)
-- Name: access_tokens; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE access_tokens (
    id uuid NOT NULL,
    scope character varying(255) NOT NULL,
    "expirationDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" bigint
);


ALTER TABLE public.access_tokens OWNER TO test;

--
-- TOC entry 183 (class 1259 OID 16463)
-- Name: batteries; Type: TABLE; Schema: public; Owner: test; Tablespace: 
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


ALTER TABLE public.batteries OWNER TO test;

--
-- TOC entry 182 (class 1259 OID 16461)
-- Name: batteries_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE batteries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.batteries_id_seq OWNER TO test;

--
-- TOC entry 2964 (class 0 OID 0)
-- Dependencies: 182
-- Name: batteries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE batteries_id_seq OWNED BY batteries.id;


--
-- TOC entry 185 (class 1259 OID 16478)
-- Name: exports; Type: TABLE; Schema: public; Owner: test; Tablespace: 
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


ALTER TABLE public.exports OWNER TO test;

--
-- TOC entry 184 (class 1259 OID 16476)
-- Name: exports_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE exports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exports_id_seq OWNER TO test;

--
-- TOC entry 2967 (class 0 OID 0)
-- Dependencies: 184
-- Name: exports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE exports_id_seq OWNED BY exports.id;


--
-- TOC entry 172 (class 1259 OID 16397)
-- Name: groups; Type: TABLE; Schema: public; Owner: test; Tablespace: 
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


ALTER TABLE public.groups OWNER TO test;

--
-- TOC entry 173 (class 1259 OID 16400)
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO test;

--
-- TOC entry 2970 (class 0 OID 0)
-- Dependencies: 173
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE groups_id_seq OWNED BY groups.id;


--
-- TOC entry 181 (class 1259 OID 16452)
-- Name: histories; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE histories (
    id integer NOT NULL,
    "previousState" character varying(255),
    "nextState" character varying(255),
    "userId" bigint,
    date timestamp with time zone,
    extras text
);


ALTER TABLE public.histories OWNER TO test;

--
-- TOC entry 180 (class 1259 OID 16450)
-- Name: histories_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.histories_id_seq OWNER TO test;

--
-- TOC entry 2973 (class 0 OID 0)
-- Dependencies: 180
-- Name: histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE histories_id_seq OWNED BY histories.id;


--
-- TOC entry 189 (class 1259 OID 16512)
-- Name: incidentForms; Type: TABLE; Schema: public; Owner: test; Tablespace: 
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


ALTER TABLE public."incidentForms" OWNER TO test;

--
-- TOC entry 188 (class 1259 OID 16510)
-- Name: incidentForms_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE "incidentForms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."incidentForms_id_seq" OWNER TO test;

--
-- TOC entry 2976 (class 0 OID 0)
-- Dependencies: 188
-- Name: incidentForms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE "incidentForms_id_seq" OWNED BY "incidentForms".id;


--
-- TOC entry 187 (class 1259 OID 16499)
-- Name: incidents; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE incidents (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    "userId" bigint NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL
);


ALTER TABLE public.incidents OWNER TO test;

--
-- TOC entry 186 (class 1259 OID 16497)
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE incidents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.incidents_id_seq OWNER TO test;

--
-- TOC entry 2979 (class 0 OID 0)
-- Dependencies: 186
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE incidents_id_seq OWNED BY incidents.id;


--
-- TOC entry 174 (class 1259 OID 16402)
-- Name: locations; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE locations (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    "userId" bigint
);


ALTER TABLE public.locations OWNER TO test;

--
-- TOC entry 175 (class 1259 OID 16405)
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locations_id_seq OWNER TO test;

--
-- TOC entry 2982 (class 0 OID 0)
-- Dependencies: 175
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE locations_id_seq OWNED BY locations.id;


--
-- TOC entry 176 (class 1259 OID 16407)
-- Name: users; Type: TABLE; Schema: public; Owner: test; Tablespace: 
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


ALTER TABLE public.users OWNER TO test;

--
-- TOC entry 177 (class 1259 OID 16414)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO test;

--
-- TOC entry 2985 (class 0 OID 0)
-- Dependencies: 177
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- TOC entry 178 (class 1259 OID 16416)
-- Name: videos; Type: TABLE; Schema: public; Owner: test; Tablespace: 
--

CREATE TABLE videos (
    id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    duration integer NOT NULL,
    "userId" integer,
    "isValid" boolean,
    filesize integer NOT NULL
);


ALTER TABLE public.videos OWNER TO test;

--
-- TOC entry 2796 (class 2604 OID 16419)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY "SequelizeMetaBackup" ALTER COLUMN id SET DEFAULT nextval('"SequelizeMeta_id_seq"'::regclass);


--
-- TOC entry 2803 (class 2604 OID 16466)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY batteries ALTER COLUMN id SET DEFAULT nextval('batteries_id_seq'::regclass);


--
-- TOC entry 2804 (class 2604 OID 16481)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY exports ALTER COLUMN id SET DEFAULT nextval('exports_id_seq'::regclass);


--
-- TOC entry 2797 (class 2604 OID 16420)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY groups ALTER COLUMN id SET DEFAULT nextval('groups_id_seq'::regclass);


--
-- TOC entry 2802 (class 2604 OID 16455)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY histories ALTER COLUMN id SET DEFAULT nextval('histories_id_seq'::regclass);


--
-- TOC entry 2806 (class 2604 OID 16515)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY "incidentForms" ALTER COLUMN id SET DEFAULT nextval('"incidentForms_id_seq"'::regclass);


--
-- TOC entry 2805 (class 2604 OID 16502)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY incidents ALTER COLUMN id SET DEFAULT nextval('incidents_id_seq'::regclass);


--
-- TOC entry 2798 (class 2604 OID 16421)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY locations ALTER COLUMN id SET DEFAULT nextval('locations_id_seq'::regclass);


--
-- TOC entry 2800 (class 2604 OID 16422)
-- Name: id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- TOC entry 2808 (class 2606 OID 16424)
-- Name: SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY "SequelizeMetaBackup"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (id);


--
-- TOC entry 2826 (class 2606 OID 16446)
-- Name: SequelizeMeta_pkey1; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY "SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey1" PRIMARY KEY (name);


--
-- TOC entry 2810 (class 2606 OID 16426)
-- Name: access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
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
-- TOC entry 2832 (class 2606 OID 16468)
-- Name: batteries_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY batteries
    ADD CONSTRAINT batteries_pkey PRIMARY KEY (id);


--
-- TOC entry 2834 (class 2606 OID 16486)
-- Name: exports_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY exports
    ADD CONSTRAINT exports_pkey PRIMARY KEY (id);


--
-- TOC entry 2812 (class 2606 OID 16428)
-- Name: groups_name_key; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_name_key UNIQUE (name);


--
-- TOC entry 2814 (class 2606 OID 16430)
-- Name: groups_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 2828 (class 2606 OID 16460)
-- Name: histories_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY histories
    ADD CONSTRAINT histories_pkey PRIMARY KEY (id);


--
-- TOC entry 2838 (class 2606 OID 16520)
-- Name: incidentForms_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY "incidentForms"
    ADD CONSTRAINT "incidentForms_pkey" PRIMARY KEY (id);


--
-- TOC entry 2836 (class 2606 OID 16504)
-- Name: incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- TOC entry 2816 (class 2606 OID 16432)
-- Name: locations_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 2818 (class 2606 OID 16434)
-- Name: users_email_key; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 2820 (class 2606 OID 16436)
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 2822 (class 2606 OID 16438)
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 2824 (class 2606 OID 16440)
-- Name: videos_pkey; Type: CONSTRAINT; Schema: public; Owner: test; Tablespace: 
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
-- TOC entry 2842 (class 2606 OID 16505)
-- Name: incidents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY incidents
    ADD CONSTRAINT "incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE;


--
-- TOC entry 2956 (class 0 OID 0)
-- Dependencies: 6
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- TOC entry 2958 (class 0 OID 0)
-- Dependencies: 179
-- Name: SequelizeMeta; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE "SequelizeMeta" FROM PUBLIC;
REVOKE ALL ON TABLE "SequelizeMeta" FROM test;
GRANT ALL ON TABLE "SequelizeMeta" TO test;


--
-- TOC entry 2959 (class 0 OID 0)
-- Dependencies: 169
-- Name: SequelizeMetaBackup; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE "SequelizeMetaBackup" FROM PUBLIC;
REVOKE ALL ON TABLE "SequelizeMetaBackup" FROM test;
GRANT ALL ON TABLE "SequelizeMetaBackup" TO test;


--
-- TOC entry 2961 (class 0 OID 0)
-- Dependencies: 170
-- Name: SequelizeMeta_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE "SequelizeMeta_id_seq" FROM PUBLIC;
REVOKE ALL ON SEQUENCE "SequelizeMeta_id_seq" FROM test;
GRANT ALL ON SEQUENCE "SequelizeMeta_id_seq" TO test;


--
-- TOC entry 2962 (class 0 OID 0)
-- Dependencies: 171
-- Name: access_tokens; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE access_tokens FROM PUBLIC;
REVOKE ALL ON TABLE access_tokens FROM test;
GRANT ALL ON TABLE access_tokens TO test;


--
-- TOC entry 2963 (class 0 OID 0)
-- Dependencies: 183
-- Name: batteries; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE batteries FROM PUBLIC;
REVOKE ALL ON TABLE batteries FROM test;
GRANT ALL ON TABLE batteries TO test;


--
-- TOC entry 2965 (class 0 OID 0)
-- Dependencies: 182
-- Name: batteries_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE batteries_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE batteries_id_seq FROM test;
GRANT ALL ON SEQUENCE batteries_id_seq TO test;


--
-- TOC entry 2966 (class 0 OID 0)
-- Dependencies: 185
-- Name: exports; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE exports FROM PUBLIC;
REVOKE ALL ON TABLE exports FROM test;
GRANT ALL ON TABLE exports TO test;


--
-- TOC entry 2968 (class 0 OID 0)
-- Dependencies: 184
-- Name: exports_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE exports_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE exports_id_seq FROM test;
GRANT ALL ON SEQUENCE exports_id_seq TO test;


--
-- TOC entry 2969 (class 0 OID 0)
-- Dependencies: 172
-- Name: groups; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE groups FROM PUBLIC;
REVOKE ALL ON TABLE groups FROM test;
GRANT ALL ON TABLE groups TO test;


--
-- TOC entry 2971 (class 0 OID 0)
-- Dependencies: 173
-- Name: groups_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE groups_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE groups_id_seq FROM test;
GRANT ALL ON SEQUENCE groups_id_seq TO test;


--
-- TOC entry 2972 (class 0 OID 0)
-- Dependencies: 181
-- Name: histories; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE histories FROM PUBLIC;
REVOKE ALL ON TABLE histories FROM test;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE ON TABLE histories TO test;


--
-- TOC entry 2974 (class 0 OID 0)
-- Dependencies: 180
-- Name: histories_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE histories_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE histories_id_seq FROM test;
GRANT ALL ON SEQUENCE histories_id_seq TO test;


--
-- TOC entry 2975 (class 0 OID 0)
-- Dependencies: 189
-- Name: incidentForms; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE "incidentForms" FROM PUBLIC;
REVOKE ALL ON TABLE "incidentForms" FROM test;
GRANT ALL ON TABLE "incidentForms" TO test;


--
-- TOC entry 2977 (class 0 OID 0)
-- Dependencies: 188
-- Name: incidentForms_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE "incidentForms_id_seq" FROM PUBLIC;
REVOKE ALL ON SEQUENCE "incidentForms_id_seq" FROM test;
GRANT ALL ON SEQUENCE "incidentForms_id_seq" TO test;


--
-- TOC entry 2978 (class 0 OID 0)
-- Dependencies: 187
-- Name: incidents; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE incidents FROM PUBLIC;
REVOKE ALL ON TABLE incidents FROM test;
GRANT ALL ON TABLE incidents TO test;


--
-- TOC entry 2980 (class 0 OID 0)
-- Dependencies: 186
-- Name: incidents_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE incidents_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE incidents_id_seq FROM test;
GRANT ALL ON SEQUENCE incidents_id_seq TO test;


--
-- TOC entry 2981 (class 0 OID 0)
-- Dependencies: 174
-- Name: locations; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE locations FROM PUBLIC;
REVOKE ALL ON TABLE locations FROM test;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE ON TABLE locations TO test;


--
-- TOC entry 2983 (class 0 OID 0)
-- Dependencies: 175
-- Name: locations_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE locations_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE locations_id_seq FROM test;
GRANT ALL ON SEQUENCE locations_id_seq TO test;


--
-- TOC entry 2984 (class 0 OID 0)
-- Dependencies: 176
-- Name: users; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE users FROM PUBLIC;
REVOKE ALL ON TABLE users FROM test;
GRANT ALL ON TABLE users TO test;


--
-- TOC entry 2986 (class 0 OID 0)
-- Dependencies: 177
-- Name: users_id_seq; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON SEQUENCE users_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE users_id_seq FROM test;
GRANT ALL ON SEQUENCE users_id_seq TO test;


--
-- TOC entry 2987 (class 0 OID 0)
-- Dependencies: 178
-- Name: videos; Type: ACL; Schema: public; Owner: test
--

REVOKE ALL ON TABLE videos FROM PUBLIC;
REVOKE ALL ON TABLE videos FROM test;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE ON TABLE videos TO test;


--
-- TOC entry 1545 (class 826 OID 16448)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: test
--

ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public REVOKE ALL ON SEQUENCES  FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public REVOKE ALL ON SEQUENCES  FROM test;
ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES  TO test;


--
-- TOC entry 1544 (class 826 OID 16447)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: test
--

ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public REVOKE ALL ON TABLES  FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public REVOKE ALL ON TABLES  FROM test;
ALTER DEFAULT PRIVILEGES FOR ROLE test IN SCHEMA public GRANT SELECT,INSERT ON TABLES  TO test;


-- Completed on 2016-03-30 23:15:27 WEST

--
-- PostgreSQL database dump complete
--

