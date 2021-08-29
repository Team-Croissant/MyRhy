/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * URLATE 백엔드 서버를 구동하기 위한 설정입니다.
 */
export interface URLATEConfig {
  /**
   * JSON 스키마 지정입니다.
   */
  $schema: string;
  project: Project;
  database: Database;
  session: Session;
  google: GoogleAPI;
  toss: TossAPI;
  tossBilling: TossBillingAPI;
  danal: DanalAPI;
}
/**
 * URLATE 자체 설정입니다.
 */
export interface Project {
  /**
   * 현재 프론트 엔드 서버가 호스트되고 있는 URL입니다.
   */
  url: string;
  /**
   * 백엔드 서버가 열릴 포트입니다.
   */
  port: {
    [k: string]: unknown;
  };
}
/**
 * 데이터베이스 연결을 위한 설정입니다.
 */
export interface Database {
  /**
   * Redis 서버 주소입니다.
   */
  redis: string;
  /**
   * MySQL 서버 호스트입니다. 주 데이터베이스 및 세션 저장소에 활용됩니다.
   */
  host: string;
  /**
   * MySQL 세션 저장소 포트입니다.
   */
  port: number;
  /**
   * MySQL 사용자명입니다.
   */
  user: string;
  /**
   * MySQL 사용자의 비밀번호입니다.
   */
  password: string;
  /**
   * MySQL에서 사용할 데이터베이스 이름입니다.
   */
  db: string;
}
/**
 * 세션 관련 설정입니다.
 */
export interface Session {
  /**
   * 세션 암호화에 사용할 시크릿 키입니다.
   */
  secret: string;
  /**
   * 세션을 언제나 세션 저장소에 다시 저장할지 여부입니다.
   * 변경된 점이 없더라도 다시 저장할 것이며,
   * 이 값을 true로 설정하는 것은 동시성 문제를 야기할 수도 있습니다.
   * 설정하지 않는다면 true로 설정될 것이나, 미래 버전에서 바뀔 수 있습니다.
   */
  resave?: boolean;
  /**
   * 초기화하지 않은 세션일지라도 강제로 저장할지 여부입니다.
   * 초기화하지 않은 세션이라 함은 새로운 세션에 값을 넣지 않았을 때를 말합니다.
   * false로 설정한다면 서버 용량 절약이나 개인정보 보호법 준수, 동시성 문제 해소 등 이점이 많습니다.
   * 설정하지 않는다면 true로 설정될 것이나, 미래 버전에서 바뀔 수 있습니다.
   */
  saveUninitialized?: boolean;
}
/**
 * Google API 설정입니다.
 */
export interface GoogleAPI {}
/**
 * Toss API 설정입니다.
 */
export interface TossAPI {
  /**
   * Toss API를 사용할 때 Basic 인증을 하기 위해 쓰는 토큰입니다.
   */
  basicKey: string;
}
/**
 * Toss Billing API 설정입니다.
 */
export interface TossBillingAPI {
  /**
   * Toss Billing API를 사용할 때 Basic 인증을 하기 위해 쓰는 토큰입니다.
   */
  basicKey: string;
}
/**
 * Danal API 설정입니다.
 */
export interface DanalAPI {}
