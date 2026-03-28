import React, { useState, useEffect } from 'react';
import { ActionIcon, Textarea, TextInput, Alert, Divider } from '@mantine/core';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { persistProfile } from '../../store/slices/ProfileSlice';
import { successNotification, errorNotification } from '../../services/NotificationService';
import { extractErrorMessage } from '../../services/error-extractor-service';
import { useMediaQuery } from '@mantine/hooks';

const About: React.FC = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state: any) => state.profile) as {
    about?: string;
    cvHeadline?: string;
    profileSummary?: string;
    [key: string]: any;
  };

  const [about, setAbout] = useState<string>(profile.about || '');
  const [cvHeadline, setCvHeadline] = useState<string>(profile.cvHeadline || '');
  const [profileSummary, setProfileSummary] = useState<string>(profile.profileSummary || '');
  const [edit, setEdit] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const matches = useMediaQuery('(max-width: 475px)');

  useEffect(() => {
    if (!edit) {
      setAbout(profile.about || '');
      setCvHeadline(profile.cvHeadline || '');
      setProfileSummary(profile.profileSummary || '');
    }
  }, [profile.about, profile.cvHeadline, profile.profileSummary, edit]);

  const handleClick = () => {
    if (!edit) {
      setAbout(profile.about || '');
      setCvHeadline(profile.cvHeadline || '');
      setProfileSummary(profile.profileSummary || '');
    }
    setEdit((prev) => !prev);
    setValidationError('');
  };

  const handleSave = async () => {
    setValidationError('');
    const updatedProfile = { ...profile, about, cvHeadline, profileSummary };

    try {
      await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
      successNotification('Success', 'About section updated');
      setEdit(false);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      errorNotification('Update Failed', errorMessage);
    }
  };

  const hasContent = profile.about || profile.cvHeadline || profile.profileSummary;

  return (
    <div className="mt-2">
      {/* Edit Controls */}
      <div className="flex justify-end mb-1">
        {edit && (
          <ActionIcon onClick={handleSave} variant="subtle" color="green.8" size={matches ? 'md' : 'lg'}>
            <IconCheck className="w-4/5 h-4/5" stroke={1.5} />
          </ActionIcon>
        )}
        <ActionIcon
          onClick={handleClick}
          variant="subtle"
          color={edit ? 'red.8' : 'brightSun.4'}
          size={matches ? 'md' : 'lg'}
        >
          {edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}
        </ActionIcon>
      </div>

      {validationError && (
        <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError('')}>
          {validationError}
        </Alert>
      )}

      {edit ? (
        <div className="flex flex-col gap-4">
          <TextInput
            label="CV Headline"
            placeholder="e.g., Immediate Joiner - Java Full Stack Developer"
            value={cvHeadline}
            onChange={(e) => setCvHeadline(e.currentTarget.value)}
          />
          <Textarea
            label="About Me"
            placeholder="Tell employers about yourself"
            value={about}
            onChange={(e) => setAbout(e.currentTarget.value)}
            autosize
            minRows={3}
          />
          <Textarea
            label="Profile Summary"
            placeholder="Summarize your professional background and expertise"
            value={profileSummary}
            onChange={(e) => setProfileSummary(e.currentTarget.value)}
            autosize
            minRows={3}
          />
        </div>
      ) : hasContent ? (
        <div className="space-y-3">
          {profile.cvHeadline && (
            <div>
              <div className="text-xs font-semibold text-bright-sun-400 uppercase tracking-wider mb-1">Headline</div>
              <p className="text-sm text-mine-shaft-200">{profile.cvHeadline}</p>
            </div>
          )}
          {profile.about && (
            <div>
              <div className="text-xs font-semibold text-bright-sun-400 uppercase tracking-wider mb-1">About</div>
              <p className="text-sm leading-7 text-mine-shaft-200 text-justify whitespace-pre-wrap">{profile.about}</p>
            </div>
          )}
          {profile.profileSummary && (
            <div>
              <div className="text-xs font-semibold text-bright-sun-400 uppercase tracking-wider mb-1">Summary</div>
              <p className="text-sm leading-7 text-mine-shaft-200 text-justify whitespace-pre-wrap">{profile.profileSummary}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-mine-shaft-400 italic">No information provided. Click edit to add your headline, about, and summary.</p>
      )}
    </div>
  );
};

export default About;
