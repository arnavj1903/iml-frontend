export interface FileWithMetadata extends File {
  metadata?: {
    semester: string;
    programme: string;
    course: string;
    section: string;
  };
}

export interface Detection {
  class: string;
  coordinates: [number, number, number, number];
  confidence: number;
  recognized_value: string;
}

export interface Visualization {
  image_path: string;
  detections: Detection[];
}

export interface ExcelData {
  metadata: {
    semester: string;
    programme: string;
    course: string;
    section: string;
  };
  students: Array<{
    usn: string;
    total_marks: string;
    questions: {
      [key: string]: {
        [key: string]: string;
      };
    };
  }>;
}

export interface ProcessResult {
  visualization: Visualization;
  excel_data: ExcelData;
}